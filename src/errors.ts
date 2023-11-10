/**
 * Copyright (C) 2023 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * Author : Fu Tongtang <futongtang@edgeros.com>
 * File   : errors.js
 * Desc   : custom error types
 */

export class BuildError extends Error { }

export function assert (expr: any, msg: string) {
  if (!(expr)) {
    throw Error(msg)
  }
  return expr
}
