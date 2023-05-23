import { expect } from "chai";
import mockFs from 'mock-fs'
import sinon from 'sinon'
import projectSetupWithYAML from "../src/index";
import fs from 'fs'
import path from 'path'

const schemaStr = fs.readFileSync(path.join(__dirname, '../src/schemas/project-setup-validation.schema.yaml'))

describe("Testing YAML environment validation", () => {
  let env: sinon.SinonStub, sandbox: sinon.SinonStub, originalConsoleError: any;
  
  beforeEach(() => {
    sandbox = sinon.stub(process, 'exit').callsFake((code?: number) => {  return undefined as never });

    // sandbox.stub(process, 'exit');
    mockFs({
      'src/schemas/project-setup-validation.schema.yaml': schemaStr,
      'project-setup-validation-test.yaml': `
      environment:
        - name: "test_str"
          type: "str"
        - name: "test_bool"
          type: "bool"
        - name: "test_num"
          type: "num"
        - name: "test_email"
          type: "email"
        - name: "test_host"
          type: "host"
        - name: "test_port"
          type: "port"
        - name: "test_url"
          type: "url"
        - name: "test_json"
          type: "json"
        - name: "test_base64String"
          type: "base64String"
        - name: "test_base64Json"
          type: "base64Json"
      `
    })
  })

  afterEach(() => {
    env.restore()
    sandbox.restore()

    mockFs.restore()

  })

  

  it("should succesfully validate all types of environment variables", () => {
    env = sinon.stub(process, 'env').value({
      test_str: 'test',
      test_bool: true,
      test_num: 69,
      test_email: 'test@gmail.com',
      test_host: '0.0.0.0',
      test_port: 3000,
      test_url: 'https://google.com',
      test_json: '{"test": true}',
      test_base64String: 'dGVzdA==', // test
      test_base64Json: 'eyJ0ZXN0IjogdHJ1ZX0=', // {"test": true}
    });

    const safeEnv = projectSetupWithYAML('./project-setup-validation-test.yaml')
      .validate();

    const tmp = {...safeEnv}
    expect(tmp).to.be.deep.equal({
      test_str: 'test',
      test_bool: true,
      test_num: 69,
      test_email: 'test@gmail.com',
      test_host: '0.0.0.0',
      test_port: 3000,
      test_url: 'https://google.com',
      test_json: {
        "test": true
      },
      test_base64String: 'test', // test
      test_base64Json: {
        "test": true
      },
    });
  });

  it("should fail validating all types", (done) => {

    env = sinon.stub(process, 'env').value({
      test_str: 1,
      test_bool: '',
      test_num: '',
      test_email: 't@est@gmail.com.illegal',
      test_host: 1, // don't trust this one
      test_port: 30000000,
      test_url: 'help.google',
      test_json: '{"test: true}',
      test_base64String: 1234, // test
      test_base64Json: 1, // {"test": true}
    });
    
    projectSetupWithYAML('./project-setup-validation-test.yaml')
      .setCustomReporter((msg: any) => {
        expect(msg.errors).to.have.keys([
          'test_str',
          'test_bool',
          'test_num',
          'test_email',
          'test_host',
          'test_port',
          'test_url',
          'test_json',
          'test_base64String',
          'test_base64Json'
        ])
        expect(msg.errors['test_str'].message).to.be.eq('Not a string: "1"')
        expect(msg.errors['test_bool'].message).to.be.eq('Invalid bool input: ""')
        expect(msg.errors['test_num'].message).to.be.eq('Invalid number input: ""')
        expect(msg.errors['test_email'].message).to.be.eq('Invalid email address: "t@est@gmail.com.illegal"')
        expect(msg.errors['test_host'].message).to.be.eq('Invalid host (domain or ip): "1"')
        expect(msg.errors['test_port'].message).to.be.eq('Invalid port input: "30000000"')
        expect(msg.errors['test_url'].message).to.be.eq('Invalid url: "help.google"')
        expect(msg.errors['test_json'].message).to.be.eq('Invalid json: "{"test: true}"')
        expect(msg.errors['test_base64String'].message).to.be.eq('Invalid base64-encoded string: a.replace is not a function')
        expect(msg.errors['test_base64Json'].message).to.be.eq('Invalid base64-encoded JSON: a.replace is not a function')
        done()
      })
      .validate();
  })
});

describe("Testing YAML logs and dir validation", () => {
  let sandbox: any
  beforeEach(() => {
    sandbox = sinon.stub(process, 'exit').callsFake((code?: number) => {  return undefined as never });
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('should create all provided directories and files', () => {
    mockFs({
      'test1/test4.js': '',
      'src/schemas/project-setup-validation.schema.yaml': schemaStr,
      'project-setup-validation-test.yaml': `
      files:
        - path: "test1.js"
          baseDir: ""
          ensureExists: true
        - path: "test2.js"
          baseDir: "%CWD%/test/"
          ensureExists: true
        - path: "/test/test3.js"
          ensureExists: true
        - path: "/test1/test4.js"
      dirs:
        - path: "/test/"
          ensureExists: true
        - path: "/test1/"
        - path: "/test2/test2/test2/"
          ensureExists: true
          baseDir: "%CWD%/test3"
      `
    })

    projectSetupWithYAML('./project-setup-validation-test.yaml')
      .validate()

    expect(fs.existsSync('./test1.js')).to.be.true;
    expect(fs.existsSync('./test/test2.js')).to.be.true;
    expect(fs.existsSync('./test/test3.js')).to.be.true;
    expect(fs.existsSync('./test1/test4.js')).to.be.true;

    expect(fs.statSync('./test').isDirectory()).to.be.true;
    expect(fs.statSync('./test1').isDirectory()).to.be.true;
    expect(fs.statSync('./test3/test2/test2/test2').isDirectory()).to.be.true;
  })

  it('should return error when dir doesnt exist', (done) => {
    mockFs({
      'test1/test4.js': '',
      'src/schemas/project-setup-validation.schema.yaml': schemaStr,
      'project-setup-validation-test.yaml': `
      config: 
        baseDir: "%MY_CWD%"
      files:
        - path: "createme/test1.js"
          ensureExists: false
      dirs:
        - path: "createme"
          ensureExists: true
        - path: "/doesntexist/"
      `
    })

    projectSetupWithYAML('./project-setup-validation-test.yaml')
      .setCustomVariable("MY_CWD", "/my_test/")
      .setCustomReporter((errors: any) => {
        if (errors.errors) {
          return
        }
        expect(fs.statSync('/my_test/createme').isDirectory()).to.be.true;
        expect(errors[0].error).to.be.eq("ERROR: Directory '/my_test/doesntexist/' does not exist.")
        done()
      })
      .validate()
  })

  it('should return error when file doesnt exist', (done) => {
    mockFs({
      '/my_test/test1/test4.js': '',
      'src/schemas/project-setup-validation.schema.yaml': schemaStr,
      'project-setup-validation-test.yaml': `
      config: 
        baseDir: "%MY_CWD%"
      files:
        - path: "test1/test4.js"
        - path: "createme/test1.js"
          ensureExists: true
        - path: "createme/test2.js"
          baseDir: "/test"
      dirs:
        - path: "createme"
          ensureExists: true
      `
    })

    projectSetupWithYAML('./project-setup-validation-test.yaml')
      .setCustomVariable("MY_CWD", "/my_test/")
      .setCustomReporter((errors: any) => {
        if (errors.errors) {
          return
        }
        expect(fs.statSync('/my_test/createme').isDirectory()).to.be.true;
        expect(fs.existsSync('/my_test/createme/test1.js')).to.be.true;
        expect(errors[0].error).to.be.eq("ERROR: File /test/createme/test2.js does not exist.")
        done()
      })
      .validate()
  })
})