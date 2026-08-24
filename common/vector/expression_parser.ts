/**
 * @module
 * copied from https://github.com/acmucsd/sdctf-2024/blob/main/web/calculator/challenge/expression_parser.ts
 */

export type Expression =
  | { op: '+' | '-' | '*' | '/' | '.'; a: Expression; b: Expression }
  | { value: number }
  | { reference: number }

type ParseResult = Generator<{ expr: Expression; string: string }>

function * parseFloat (string: string): ParseResult {
  for (const regex of [
    /[-+](?:\d+\.?|\d*\.\d+)(?:e[-+]?\d+)?$/,
    /(?:\d+\.?|\d*\.\d+)(?:e[-+]?\d+)?$/,
    /\d+&$/
  ]) {
    const match = string.match(regex)
    if (!match) {
      continue
    }
    if (match[0].endsWith('&')) {
      const index = +match[0].slice(0, -1)
      if (Number.isInteger(index)) {
        yield {
          expr: { reference: index },
          string: string.slice(0, -match[0].length)
        } 
      }
    }
    const number = +match[0]
    if (Number.isFinite(number)) {
      yield {
        expr: { value: number },
        string: string.slice(0, -match[0].length)
      }
    }
  }
}
function * parseLitExpr (string: string): ParseResult {
  yield * parseFloat(string)
  if (string[string.length - 1] === ')') {
    for (const result of parseAddExpr(string.slice(0, -1))) {
      if (result.string[result.string.length - 1] === '(') {
        yield { ...result, string: result.string.slice(0, -1) }
      }
    }
  }
}
function * parseMulExpr (string: string): ParseResult {
  for (const right of parseLitExpr(string)) {
    const op = right.string[right.string.length - 1]
    if (op === '*' || op === '/' || op === '.') {
      for (const left of parseMulExpr(right.string.slice(0, -1))) {
        yield { ...left, expr: { op, a: left.expr, b: right.expr } }
      }
    }
  }
  yield * parseLitExpr(string)
}
function * parseAddExpr (string: string): ParseResult {
  for (const right of parseMulExpr(string)) {
    const op = right.string[right.string.length - 1]
    if (op === '+' || op === '-') {
      for (const left of parseAddExpr(right.string.slice(0, -1))) {
        yield { ...left, expr: { op, a: left.expr, b: right.expr } }
      }
    }
  }
  yield * parseMulExpr(string)
}
export function parse (expression: string): Expression | null {
  for (const result of parseAddExpr(expression.replace(/\s/g, ''))) {
    if (result.string === '') {
      return result.expr
    }
  }
  return null
}
