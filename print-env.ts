async function main() {
  console.log("ALL ENV VARS:");
  for (const key of Object.keys(process.env)) {
    console.log(`${key}=${process.env[key]}`);
  }
}
main();
