import { expect } from 'chai';
import 'mocha';

var rewire = require('rewire');

var utils = rewire('../utils/git.ts');
var deriveUrl = utils.__get__('deriveUrl');

describe('github ssh url', function () {
    const githubSSHUrl = 'git@github.com:aquasecurity/tfsec.git';
    const derived = deriveUrl(githubSSHUrl);
    expect(derived).to.equal('https://github.com/aquasecurity/tfsec');
});

describe('bitbucket ssh url', function () {
    const githubSSHUrl = 'git@bitbucket.org:aquasecurity/tfsec.git';
    const derived = deriveUrl(githubSSHUrl);
    expect(derived).to.equal('https://bitbucket.org/aquasecurity/tfsec');
});


describe('github https url', function () {
    const githubSSHUrl = 'https://github.com/aquasecurity/tfsec.git';
    const derived = deriveUrl(githubSSHUrl);
    expect(derived).to.equal('https://github.com/aquasecurity/tfsec');
});


describe('bitbucket https url', function () {
    const githubSSHUrl = 'https://bitbucket.org/aquasecurity/tfsec.git';
    const derived = deriveUrl(githubSSHUrl);
    expect(derived).to.equal('https://bitbucket.org/aquasecurity/tfsec');
});