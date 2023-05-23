## How to use

```js
/** Import package */
import projectSetupWithYAML from "project-setup-validation-yaml";

/** Initialise with relative or absolute path that links to your YAML configuration */
const pswy = projectSetupWithYAML("./project-setup-validation.yaml")
/**
 * [Optional] Replaces variables set in YAML project configuration
 * In this example, %ENV% in YAML file will be replaced with 'PRD'
*/
pswy.setCustomVariable("ENV", "PRD")
/**
 * [Optional] By default package will log encountered errors to console and exit process
 * But setting reporter will override this behaviour and redirect errors to passed function
*/
pswy.setCustomReporter((errors) => {
    console.error(errors.map(e => e.error).join("\n"))
})
/**
 * validate() is the main method that invokes validation for everything we set up so far
 * validate method returns safeEnvironment object that will contain environment variables that we just validated
*/
const safeEnv = pswy.validate()

```

#### You can also chain these operations for aesthetic look

```js
/**
 * Every public method except 'validate()' will return same instance
 * This allows us to chain the methods like this
 */

const safeEnv = projectSetupWithYAML("./project-setup-validation.yaml")
    .setCustomReporter((errors) => {
        console.error(errors.map(e => e.error).join("\n"))
    })
    .setCustomVariable("MY_VAR", "/test")
    .setCustomVariable("CWD", "will replace process.cwd() with our value here")
    .validate()

```

## YAML configuration/ project setup validation example/ schema

### Simple example of project setup validation YAML

```yaml
config:
  baseDir: "%CWD%"
environment:
  - name: "EXAMPLE_ENV"
    type: "str"
files:
  - path: "/src/index.js"
    ensureExists: false
    baseDir: "%MY_VAR%"
dirs:
  - path: "/node_modules"
```

### Full example of project setup validation YAML

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

### Shema that is used to validate project setup YAML

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