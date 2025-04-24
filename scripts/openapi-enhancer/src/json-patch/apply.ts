import { isPlainObject } from '@stoplight/json';
import { applyOperation as _applyOperation, getValueByPointer, type Operation } from 'fast-json-patch/module/core.mjs';
import { PatchError } from 'fast-json-patch/module/helpers.mjs';

export type { Operation, PatchError };

export default function applyOperation(document: unknown, operation: Operation) {
  recoverableApplyOperation(document, operation, false);
}

function recoverableApplyOperation(document: unknown, operation: Operation, recovering: boolean) {
  try {
    _applyOperation(document, operation, true, true);
  } catch (e) {
    if (recovering) {
      throw e;
    }

    if (!(e instanceof PatchError)) {
      throw new Error('Unexpected error', { cause: e });
    }

    const patch = recover(operation);
    recoverableApplyOperation(document, patch, true);
  }
}

function recover(error: PatchError): Operation {
  switch (error.name) {
    case 'OPERATION_PATH_UNRESOLVABLE':
      return recoverFromOpPathUnresolvable(error);
    case 'SEQUENCE_NOT_AN_ARRAY':
    case 'OPERATION_NOT_AN_OBJECT':
    case 'OPERATION_OP_INVALID':
    case 'OPERATION_PATH_INVALID':
    case 'OPERATION_FROM_REQUIRED':
    case 'OPERATION_VALUE_REQUIRED':
    case 'OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED':
    case 'OPERATION_PATH_CANNOT_ADD':
    case 'OPERATION_FROM_UNRESOLVABLE':
    case 'OPERATION_PATH_ILLEGAL_ARRAY_INDEX':
    case 'OPERATION_VALUE_OUT_OF_BOUNDS':
    case 'TEST_OPERATION_FAILED':
    default:
      throw error;
  }
}

/**
 * At the moment the function recovers only when a replace operation is issued, but the value does not exist.
 * In such a case, we'll gracefully turn it into an add operation.
 */
function recoverFromOpPathUnresolvable(error: PatchError): Operation {
  const operation = error.operation as Operation;
  if (operation.op !== 'replace') {
    throw error;
  }

  const path = operation.path.split('/').slice(0, -1).join('/');
  const existingValue = getValueByPointer(error.tree, path);
  if (isPlainObject(existingValue)) {
    return {
      op: 'add',
      path: operation.path,
      value: operation.value,
    };
  }

  throw error;
}
