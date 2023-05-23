import { ValidatorSpec, bool, cleanEnv, email, host, json, makeValidator, num, port, str, url } from "envalid"
import { decode } from "js-base64";

/**
 * Validates base64, converts to json object and returns
 */
const base64JsonValidator = makeValidator((input) => {
    try {
        const str = decode(input)
        const json = JSON.parse(str);
        return json
    } catch (err: any) {
        throw new Error(`Invalid base64-encoded JSON: ${err.message}`);
    }
});

/**
 * Validates base64, converts to string and returns
 */
const base64StringValidator = makeValidator((input) => {
    try {
        const str = decode(input)
        return str
    } catch (err: any) {
        throw new Error(`Invalid base64-encoded string: ${err.message}`);
    }
});

/**
 * Validation types, default + custom
 */
export const envalidValidationTypes = {
    str,
    email,
    json,
    bool,
    host,
    num,
    port,
    url,
    base64String: base64StringValidator,
    base64Json: base64JsonValidator
} as const


interface ICustomEnvValidators {
    base64JsonValidator: () => ValidatorSpec<any>,
    base64StringValidator: () => ValidatorSpec<any>
}

/**
 * Custom validators
 */
export const customEnvValidators: ICustomEnvValidators = {
    base64JsonValidator,
    base64StringValidator
}

/**
 * Validates and returns clean env
 * 
 * Example:
 * 
    ```
    import { str, json } from 'envalid'
    import {validateProjectEnvironment, customValidators} from './src/validators'

    validateProjectEnvironment(process.env, {
        FIREBASE_CREDENTIALS_BASE64: customValidators.base64JsonValidator(),
        TEST_STRING_ENV: str(),
        TEST_JSON_ENV: json()
    })

    ```
    Read more: https://www.npmjs.com/package/envalid
 */
export const validateProjectEnvironment = cleanEnv;