## How to use

#### Install

```shell

npm i project-setup-validation-yaml
```

#### Minimal setup

```yaml
# ./project-setup-validation.yaml

environment:
  - name: "TEST"
    type: "str"
  - name: "my_email"
    type: "email"
```

```typescript
// ./index.ts
import projectSetupWithYAML from "project-setup-validation-yaml";

const safeEnv = projectSetupWithYAML("./project-setup-validation.yaml")
    .validate() // Readonly<any>

console.log(safeEnv.TEST) 
console.log(safeEnv.my_email)
    
```

#### Example of failed validation
```yaml
environment:
  - name: "NON_EXISTING"
    type: "str"
  - name: "SLACK_ERROR_HOOK_BASE64"
    type: "url"
```

```c#
// This will be outputed to console
================================
 Invalid environment variables:
    SLACK_ERROR_HOOK_BASE64: Invalid url: "af830sf02fnAFNnfuaeoJFNAufneN=="
 Missing environment variables:
    NON_EXISTING: undefined
================================

 Exiting with error code 1

```

#### Setting validated environment type for TypeScript

```typescript
type safeEnvType = type safeEnvType = {
    NODE_ENV: string,
    TEST: string,
}

const safeEnv = projectSetupWithYAML("./project-setup-validation.yaml")
    .validate<safeEnvType>() // Readonly<safeEnvType>

console.log(safeEnv.NODE_ENV) // works
console.log(safeEnv.IDONTEXIST) // error

```

#### Full example
```typescript
/** Import package */
import projectSetupWithYAML from "project-setup-validation-yaml";

/** Initialise with relative or absolute path that links to your YAML configuration */
const safeEnv = projectSetupWithYAML("./project-setup-validation.yaml")
    /**
     * [Optional] Replaces variables set in YAML project configuration
     * In this example, %ENV% in YAML file will be replaced with 'PRD'
    */
    .setCustomVariable("ENV", "PRD")
    /**
     * [Optional] By default package will log encountered errors to console and exit process
     * But setting reporter will override this behaviour and redirect errors to passed function
    */
    .setCustomReporter((errors) => {
        console.error(errors.map(e => e.error).join("\n"))
    })
    /**
     * validate() is the main method that invokes validation for everything we set up so far
     * validate method returns safeEnvironment object that will contain environment variables that we just validated
    */
    .validate()

```
<br>
## Full YAML configuration & Schema

#### Full example of project setup validation YAML

```yaml

config:
  # Configuration (Global settings)
  #  baseDir [string, optional] - will be used as baseDir for files and dirs that doesn't have individual property 'baseDir' set
  #
  baseDir: "%CWD%"
environment:  
  # Environment property
  #  name [string, required] - name of the environment variable
  #  type [string, required] - environment variable type
  #
  # Available environment types: 
  #  str - Passes string values through, will ensure an value is present unless a default value is given. Note that an empty string is considered a valid value - if this is undesirable you can easily create your own validator (see below)
  #  bool - Parses env var strings "1", "0", "true", "false", "t", "f" into booleans
  #  num - Parses an env var (eg. "42", "0.23", "1e5") into a Number
  #  email - Ensures an env var is an email address
  #  host- Ensures an env var is either a domain name or an ip address (v4 or v6)
  #  port - Ensures an env var is a TCP port (1-65535)
  #  url - Ensures an env var is a url with a protocol and hostname
  #  json - Parses an env var with JSON.parse
  #  base64Json - (CUSTOM) Parses an env var as base64 and converts to JSON
  #  base64String - (CUSTOM) Parses an env var as base64 and returns string
  #
  - name: "EXAMPLE_ENV"
    type: "str"
  # - name: "TEST"
  #   type: "url"
  # - name: "TEST2"
  #   type: "json"
  # - name: "TEST3"
  #   type: "base64Json"
files:
  # Files property
  #  path [string, required] - string representation of path to where the file is supposed to be
  #  ensureExists [bool, optional, default = false] - creates empty file and directory to it if set to true
  #  baseDir [string, optional, default = ""] - sets individual base directory (ignores global)
  #
  # - path: "/data/test.js"
  #   ensureExists: true
  #   baseDir: "D:/"  
dirs:
  # Dirs property
  #  path [string, required] - string representation of path to where the directory is supposed to be
  #  ensureExists [bool, optional] - creates directories if it doesn't exist
  #  baseDir [string, optional] - sets individual base directory (ignores global)
  #
  # - path: "/data/test
  #   ensureExists: true
  #   baseDir: "D:/"  


# Custom variables
#  %CWD% will be replaced with current cwd that the program starts with or can be passed as argument
```

#### Shema that is used to validate project setup YAML

```yaml

$schema: http://json-schema.org/draft-07/schema#
type: object
properties:
  config:
    type: object
    properties:
      baseDir:
        type: string
  environment:
    type: array
    items:
      type: object
      properties:
        name:
          type: string
        type:
          type: string
          enum: ["str", "bool", "num", "email", "host", "port", "url", "json", "base64Json", "base64String"]
      required:
        - name
        - type
  files:
    type: array
    items:
      type: object
      properties:
        path:
          type: string
        ensureExists:
          type: boolean
        baseDir:
          type: string
      required:
        - path
  dirs:
    type: array
    items:
      type: object
      properties:
        path:
          type: string
        ensureExists:
          type: boolean
        baseDir:
          type: string
      required:
        - path


```