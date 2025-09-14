// ปิด webpack deprecation warnings
process.env.GENERATE_SOURCEMAP = "false";

module.exports = function(app) {
  // ปิด deprecation warnings
  process.removeAllListeners('warning');
};
