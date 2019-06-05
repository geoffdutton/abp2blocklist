/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

// Example: node abp2blocklist.js test.txt [-o test.json]

const argv = require('minimist')(process.argv.slice(2))
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const { Filter } = require('./adblockpluscore/lib/filterClasses')
const { ContentBlockerList } = require('./lib/abp2blocklist.js')

const rl = readline.createInterface({
  input: fs.createReadStream(argv._[0]),
  terminal: false
})
const blockerList = new ContentBlockerList({ merge: 'all' })

const stringifyRule = rule => JSON.stringify(rule, null, '\t')

const outputPath = path.resolve(__dirname, 'sources')

rl.on('line', line => {
  if (/^\s*[^[\s]/.test(line)) {
    const normal = Filter.normalize(line)
    const fromTxt = Filter.fromText(normal)
    blockerList.addFilter(fromTxt)
  }
})

rl.on('close', () => {
  blockerList.generateRules().then(rules => {
    console.info(`Writing ${rules.length} rules...`)
    const output = fs.createWriteStream(path.resolve(outputPath, argv.o || 'output.json'))
    // If the rule set is too huge, JSON.stringify throws
    // "RangeError: Invalid string length" on Node.js. As a workaround, print
    // each rule individually.
    output.write('[')
    if (rules.length > 0) {
      for (let i = 0; i < rules.length - 1; i++) {
        output.write(stringifyRule(rules[i]) + ',')
      }
      output.write(stringifyRule(rules[rules.length - 1]))
    }

    return new Promise(resolve => output.end(']', resolve))
  })
})
