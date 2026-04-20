const version = process.versions.node;

function parseVersion(input) {
  const [major, minor, patch] = input.split(".").map((value) => Number.parseInt(value, 10));

  return { major, minor, patch };
}

function isAtLeast(current, minimum) {
  if (current.major !== minimum.major) {
    return current.major > minimum.major;
  }

  if (current.minor !== minimum.minor) {
    return current.minor > minimum.minor;
  }

  return current.patch >= minimum.patch;
}

const current = parseVersion(version);
const supportedMinimums = [
  { major: 20, minor: 19, patch: 0 },
  { major: 22, minor: 12, patch: 0 },
  { major: 24, minor: 0, patch: 0 },
];

const isSupported = supportedMinimums.some(
  (minimum) => current.major === minimum.major && isAtLeast(current, minimum),
);

if (!isSupported) {
  console.error(
    [
      `Unsupported Node.js runtime: ${version}.`,
      "Supported project runtimes are 20.19+, 22.12+, or 24.x.",
      "If you use nvm, run: nvm use",
      'If you use Homebrew, prepend PATH with /opt/homebrew/opt/node@24/bin before running project commands.',
    ].join("\n"),
  );

  process.exit(1);
}

console.log(`Using supported Node.js runtime ${version}.`);
