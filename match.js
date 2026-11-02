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
  return { status: 'matched', result: displayResult };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { matchWZTI, calculateWZTIDimensions };
if (typeof globalThis !== 'undefined') { globalThis.matchWZTI = matchWZTI; globalThis.calculateWZTIDimensions = calculateWZTIDimensions; }
