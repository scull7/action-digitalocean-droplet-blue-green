export default function factory() {
  return {
    files: [
      'test/**/*',
      '__tests__/**/*',
      '!test/util/**/*',
    ],
    failFast: false,
    failWithoutAssertions: true,
  };
}
