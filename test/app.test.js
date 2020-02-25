let initializeSpectron = require("./testhelper");
const assert = require('assert')
let chai = require("chai");
let chaiAsPromised = require("chai-as-promised");
global.before(function () {
    chai.should();
    chai.use(chaiAsPromised);
});
let app = initializeSpectron();
describe('Application launch', function () {
    this.enableTimeouts(false)
  
    beforeEach(function () {
      
      return app.start()
    })
  
    afterEach(function () {
      if (app && app.isRunning()) {
        return app.stop()
      }
    })
  
    it('shows an initial window', function () {
      return app.client.getWindowCount().then(function (count) {
        assert.equal(count, 1)
        // Please note that getWindowCount() will return 2 if `dev tools` are opened.
        // assert.equal(count, 2)
      })
    })
  })