import { expect } from 'chai';
import { Platform, TouchableHighlight } from 'react-native';

jest.dontMock('../src/helpers');
const {
  measure,
  makeName,
  makeTouchable,
  lo,
  isClassComponent,
  deprecatedComponent,
} = require('../src/helpers');

describe('helpers test', () => {
  describe('measure', () => {
    it('should be a function', () => {
      expect(measure).to.be.a('function');
    });

    it('should promisify measure callback', done => {
      const ref = {
        measure: callback => callback(0, 0, 100, 200, 50, 20),
      };
      measure(ref)
        .then(layout => {
          expect(layout).to.be.an('object');
          expect(layout).to.eql({
            x: 50,
            y: 20,
            width: 100,
            height: 200,
          });
          done();
        })
        .catch((err = 'promise rejected') => done(err));
    });
  });

  describe('makeName', () => {
    it('should be a function', () => {
      expect(makeName).to.be.a('function');
    });

    it('should return unique names', () => {
      const name1 = makeName(),
        name2 = makeName();
      expect(name1).to.be.a('string');
      expect(name2).to.be.a('string');
      expect(name1).not.to.be.equal(name2);
    });
  });

  describe('makeTouchable', () => {
    it('should create TouchableHighlight for android', () => {
      Platform.select.mockImplementationOnce(o => {
        return o.android;
      });
      const { Touchable, defaultTouchableProps } = makeTouchable();
      expect(Touchable).to.be.equal(TouchableHighlight);
      expect(defaultTouchableProps).to.be.an('object');
    });

    it('should create TouchableHighlight for ios', () => {
      Platform.select.mockImplementationOnce(o => {
        return o.ios;
      });
      const { Touchable, defaultTouchableProps } = makeTouchable();
      expect(Touchable).to.be.equal(TouchableHighlight);
      expect(defaultTouchableProps).to.be.an('object');
    });

    it('should create TouchableHighlight for default', () => {
      Platform.select.mockImplementationOnce(o => {
        return o.default;
      });
      const { Touchable, defaultTouchableProps } = makeTouchable();
      expect(Touchable).to.be.equal(TouchableHighlight);
      expect(defaultTouchableProps).to.be.an('object');
    });

    it('should return passed component', () => {
      const MyTouchable = () => null;
      const { Touchable, defaultTouchableProps } = makeTouchable(MyTouchable);
      expect(Touchable).to.be.equal(MyTouchable);
      expect(defaultTouchableProps).to.be.an('object');
    });
  });
});
