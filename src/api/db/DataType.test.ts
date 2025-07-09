import { valueToString, resolvePrimitiveType, toBaseType, areTypesEqual, resolveDataTypeFromString } from './DataType';
import Decimal from 'decimal.js';

describe('DataType module', () => {
    describe('valueToString', () => {
        it('should format boolean values correctly', () => {
            expect(valueToString(true, 'boolean')).toBe('true');
            expect(valueToString(false, 'boolean')).toBe('false');
        });

        it('should format numbers with thousands separator', () => {
            expect(valueToString(1234567.89, 'decimal', { thousandsSeparator: true })).toBe('1,234,567.89');
        });

        it('should format dates correctly', () => {
            const date = new Date('2025-07-09T12:34:56Z');
            expect(valueToString(date, 'datetime')).toBe('2025-07-09 12:34:56');
        });

        it('should format arrays correctly', () => {
            expect(valueToString([1, 2, 3], ['int'])).toBe('[1, 2, 3]');
        });

        it('should truncate long strings if maxLength is set', () => {
            expect(valueToString('This is a very long string', 'string', { maxLength: 10 })).toBe('This is a ');
        });
    });

    describe('resolvePrimitiveType', () => {
        it('should resolve primitive types correctly', () => {
            expect(resolvePrimitiveType('string')).toBe('string');
            expect(resolvePrimitiveType(123)).toBe('number');
            expect(resolvePrimitiveType(true)).toBe('boolean');
            expect(resolvePrimitiveType([1, 2, 3])).toBe('array');
            expect(resolvePrimitiveType({ key: 'value' })).toBe('object');
            expect(resolvePrimitiveType(undefined)).toBeNull();
        });
    });

    describe('toBaseType', () => {
        it('should resolve base types correctly', () => {
            expect(toBaseType('string')).toBe('string');
            expect(toBaseType('decimal')).toBe('number');
            expect(toBaseType(['int'])).toBe('array');
        });
    });

    describe('areTypesEqual', () => {
        it('should compare types correctly', () => {
            expect(areTypesEqual('string', 'string')).toBe(true);
            expect(areTypesEqual('string', 'number')).toBe(false);
            expect(areTypesEqual(['int'], ['int'])).toBe(true);
            expect(areTypesEqual(['int'], 'int')).toBe(false);
        });
    });

    describe('resolveDataTypeFromString', () => {
        it('should resolve data types from strings correctly', () => {
            expect(resolveDataTypeFromString('123')).toBe('int');
            expect(resolveDataTypeFromString('123.45')).toBe('number');
            expect(resolveDataTypeFromString('true')).toBe('boolean');
            expect(resolveDataTypeFromString('2025-07-09')).toBe('date');
            expect(resolveDataTypeFromString('2025-07-09T12:34:56Z')).toBe('datetime');
            expect(resolveDataTypeFromString('not-a-number')).toBe('string');
        });
    });
});