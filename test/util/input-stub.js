const Sinon = require('sinon');

function full(config) {
  const inputStub = Sinon.stub();

  inputStub
    .withArgs('digital_ocean_access_token', { required: true })
    .returns('this-is-my-token');

  inputStub
    .withArgs('droplet_pair_tag', { required: true })
    .returns(config.dropletPairTag);

  inputStub
    .withArgs('ip_green', { required: true })
    .returns(config.ipGreen.ip);

  inputStub
    .withArgs('ip_blue', { required: true })
    .returns(config.ipBlue.ip);

  return inputStub;
};

module.exports = { full };
