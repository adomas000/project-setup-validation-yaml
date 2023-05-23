import * as fs from 'fs'
import YAML from 'yaml'
import Ajv, { ValidateFunction } from 'ajv'
import path from 'path'

import { customEnvValidators, validateProjectEnvironment, envalidValidationTypes, validateProjectDirectories } from './validators'
import { DirFileObject } from './validators/projectDirectoryValidator'

export default function projectSetupWithYAML(projectSetupValidationYAMLPath: string) {
    return new ProjectSetupWithYAML(projectSetupValidationYAMLPath)
}

interface IProjectSetupValidationYAMLAsJSON {
    config?: {baseDir: string},
    environment: {
        name: string,
        type: "str" | "bool" | "num" | "email" | "host" | "port" | "url" | "json" | "base64Json" | "base64String"
    }[],
    files: {
        path: string,
        ensureExists?: boolean,
        baseDir?: string
    }[],
    dirs: {
        path: string,
        ensureExists?: boolean,
        baseDir?: string
    }[]
}

interface ICustomVariablesYAML {
    CWD: string
}

type CustomVariablesYAMLTypes = keyof ICustomVariablesYAML;

class ProjectSetupWithYAML {
    private YAMLSchemaPath: string = path.join(__dirname, '/schemas/project-setup-validation.schema.yaml')
    private customVariablesYAML: ICustomVariablesYAML = {
        CWD: process.cwd()
    };

    private config = {
        projectSetupValidationYAMLPath: "",
        projectSetupValidationSchema: {},
        projectSetupValidationYAMLStr: "",
        projectSetupValidationYAMLJson: {}
    };

    constructor(projectSetupValidationYAMLPath: string) {
        this.config.projectSetupValidationYAMLPath = projectSetupValidationYAMLPath;

        if (!fs.existsSync(this.YAMLSchemaPath)) {
            throw new Error("Failed to locate YAML schema. Contact package developer")
        }

        const schemaAsString = fs.readFileSync(this.YAMLSchemaPath, 'utf8')
        
        this.config.projectSetupValidationSchema = YAML.parse(schemaAsString)

        this.loadYAMLConfiguration(this.config.projectSetupValidationYAMLPath)
    }

    validate() {
        this.setDefaultVariablesValues()
        this.validateYAMLProjectSetupAgainstSchema()
        const safeEnv = this.validateProjectSetup()
 
        return safeEnv
    }

    setCustomVariable(customVariableName: CustomVariablesYAMLTypes, value: string): ProjectSetupWithYAML
    setCustomVariable(customVariableName: string, value: string): ProjectSetupWithYAML
    setCustomVariable(customVariableName: string | CustomVariablesYAMLTypes, value: string): ProjectSetupWithYAML {
        this.config.projectSetupValidationYAMLStr = this.config.projectSetupValidationYAMLStr
            .replace(new RegExp(`%${customVariableName}%`, 'g'), value)

        return this
    }

    private validateProjectSetup() {
        const {config = {} as any, environment = [], files = [], dirs = []} = this.config.projectSetupValidationYAMLJson as IProjectSetupValidationYAMLAsJSON

        // Validate Environment
        const environmentToValidate = {} as any
        for (const {name, type} of environment) {
            environmentToValidate[name] = this.getValidatorFromType(type)()
        }

        const safeEnv = validateProjectEnvironment(process.env, environmentToValidate)

        // Validate Dirs and files
        const directorySetup: DirFileObject = {
            baseDir: config.baseDir,
            dirs: [],
            files: []
        }

        for (const dir of dirs) {
            directorySetup.dirs!.push({
                path: dir.path,
                options: {
                    baseDir: dir.baseDir,
                    ensurePath: dir.ensureExists
                }
            })
        }

        for (const file of files) {
            directorySetup.files!.push({
                path: file.path,
                options: {
                    baseDir: file.baseDir,
                    ensurePath: file.ensureExists
                }
            })
        }

        validateProjectDirectories(directorySetup)

        return safeEnv
    }

    private getValidatorFromType(type: string): Function {
        const validatorType = type as keyof typeof envalidValidationTypes
        if (!envalidValidationTypes[validatorType]) {
            throw new Error(`Unknown environment variable type: '${type}'`)
        }

        return envalidValidationTypes[validatorType]
    }

    private validateYAMLProjectSetupAgainstSchema() {
        const validate = this.compileYAMLSchema()
        this.config.projectSetupValidationYAMLJson = YAML.parse(this.config.projectSetupValidationYAMLStr)

        const valid = validate(this.config.projectSetupValidationYAMLJson)

        if (!valid) {
            throw new Error(`Error while validating '${this.config.projectSetupValidationYAMLPath}': ${validate.errors && JSON.stringify(validate.errors, null, 2)}`)
        }
    }

    private compileYAMLSchema(): ValidateFunction<unknown> {
        return new Ajv().compile(this.config.projectSetupValidationSchema);
    }

    private loadYAMLConfiguration(projectSetupValidationYAMLPath: string) {
        if (!fs.existsSync(projectSetupValidationYAMLPath)) {
            throw new Error(`YAML file at location '${projectSetupValidationYAMLPath}' doesn't exist`)
        }

        this.config.projectSetupValidationYAMLStr = fs.readFileSync(projectSetupValidationYAMLPath, 'utf8')
    }

    private setDefaultVariablesValues() {
        Object.keys(this.customVariablesYAML).forEach((varName) => {
            this.config.projectSetupValidationYAMLStr = this.config.projectSetupValidationYAMLStr
                .replace(new RegExp(`%${varName}%`, 'g'), this.customVariablesYAML[varName as CustomVariablesYAMLTypes])
        })
    }
}