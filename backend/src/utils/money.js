function roundMoney(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

module.exports = { roundMoney };
