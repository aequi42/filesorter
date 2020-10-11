const licenseLs = require('license-ls')
const fs = require('fs').promises
const { groupBy, concat, reduce } = require('lodash')

async function main() {
  const licenses = await licenseLs()
  const licenseFileStrings = await Promise.all(licenses.map(async (curr) => await formatLicense(curr)))
  const otherLicensesString = licenseFileStrings.join(`

  ---

  `)
  const head = getHead(licenses)
  await fs.writeFile(
    'ThirdPartyLicenses.md',
    `
${head}

## Licenses

${otherLicensesString}
`,
    'utf-8'
  )
}

function getHead(licenses) {
  const counts = reduce(
    groupBy(licenses, (l) => l.licenseId),
    (agg, val, key) => concat(agg, [[key, val.length]]),
    []
  )

  return `# Used Licenses

## Summary

${counts.map((c) => `* ${c[0]} : ${c[1]}`).join(`\r\n`)}

`
}

async function formatLicense(license) {
  const licenseText = await readLicenseFile(license)
  return `### ${license.name}

${licenseText.trim()}`
}

async function readLicenseFile(license) {
  var path = license.licenseFilePath[0]
  if (!path) return ''
  try {
    var fileContents = await fs.readFile(path)
    return fileContents.toString()
  } catch (err) {
    console.error(err)
    return ''
  }
}

main().then(console.log).catch(console.error).finally('done')
