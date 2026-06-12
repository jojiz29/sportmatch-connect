// ============================================================
// jest.config.js — Configuración de Jest (backend NestJS)
// Transforma TS con ts-jest,覆盖率 en /coverage, entorno node
// ============================================================

module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
};
