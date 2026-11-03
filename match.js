'use strict';
function calculateWZTIDimensions(config, answers) {
  const result = {};
  for (const rule of config.dimensionRules) {
    let total = 0, count = 0;
    for (const q of config.questions) {
      const group = rule.groups[String(q.block)];
      if (!group) continue;
      const key = q.optionKeys[answers[q.id]];
      if (!Object.prototype.hasOwnProperty.call(group, key)) throw new Error('Missing dimension answer: ' + q.id);
      total += group[key];
      count++;
    }
    if (!count) throw new Error('Empty dimension: ' + rule.name);
    result[rule.name] = Math.round(total / count);
  }
  return result;
}
function matchWZTI(config, answers = {}) {
  const missing = config.questions.filter(q => !Object.prototype.hasOwnProperty.call(q.options, answers[q.id])).map(q => q.id);
  if (missing.length) return { status: 'incomplete', missing };
  const scored = config.heroes.map((h, index) => {
    const hits = config.questions.map(q => q.optionKeys[answers[q.id]] === h.keys[q.block]);
    const groups = Array(7).fill(0);
    config.questions.forEach((q, i) => { if (hits[i]) groups[q.block] += q.weight; });
    return { hero: h.hero, index, hits, groups, score: groups.reduce((a,b) => a+b, 0) };
  });
  scored.sort((a,b) => {
    if (a.score !== b.score) return b.score-a.score;
    for (const group of config.tieBlockOrder) {
      if (a.groups[group] !== b.groups[group]) return b.groups[group]-a.groups[group];
    }
    for (let i=config.questions.length-1;i>=0;i--) {
      if (a.hits[i] !== b.hits[i]) return Number(b.hits[i])-Number(a.hits[i]);
    }
    return a.index-b.index;
  });
  const result = config.results.find(h => h['英雄名称'] === scored[0].hero);
  if (!result) throw new Error('Missing result: ' + scored[0].hero);
  const displayResult = JSON.parse(JSON.stringify(result));
  // Hero reference values stay in config; the result page shows this user's answers.
  displayResult['性格维度百分比'] = calculateWZTIDimensions(config, answers);
  const best = scored[0];
  const evidence = config.reasonStatements ? config.reasonStatements.map((texts, block) => {
    const matched = config.questions.filter((q,i) => q.block === block && best.hits[i]);
    return { block, count: matched.length, questions: matched.map(q=>q.id), text: texts[config.heroes[best.index].keys[block]] };
  }).filter(x=>x.count>=2).sort((a,b)=>b.count-a.count || config.tieBlockOrder.indexOf(a.block)-config.tieBlockOrder.indexOf(b.block)).slice(0,3) : [];
  const near = scored.slice(1).filter(x=>best.score-x.score <= (config.nearResultScoreGap ?? 2)).slice(0,2).map(x=>{
    const h=config.results.find(y=>y['英雄名称']===x.hero);
    return { '英雄名称': x.hero, '人格标题':h['人格标题'], '英雄展示图':h['英雄展示图'], '与主结果同分':x.score===best.score };
  });
  displayResult['匹配原因'] = evidence.map(x=>x.text);
  displayResult['匹配依据题号'] = evidence.map(x=>({topic:x.block,questions:x.questions}));
  displayResult['匹配原因说明'] = evidence.length ? '这些选择与你的主共鸣英雄有相似之处。' : '你的选择比较多元，本次按整体组合给出主共鸣英雄。';
  displayResult['接近结果'] = near;
  displayResult['接近结果说明'] = near.length ? '你也有这些英雄的一面；主结果按整体选择及固定排序给出。' : '';
  displayResult['维度展示单位'] = '倾向分';
  return { status: 'matched', result: displayResult };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { matchWZTI, calculateWZTIDimensions };
if (typeof globalThis !== 'undefined') { globalThis.matchWZTI = matchWZTI; globalThis.calculateWZTIDimensions = calculateWZTIDimensions; }
