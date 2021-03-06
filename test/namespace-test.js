var expect = require('./spec-helper').expect;
var minim = require('../lib/minim');
var Namespace = require('../lib/namespace');

describe('Minim namespace', function() {
  var namespace;
  var ArrayElement, NullElement, ObjectElement, StringElement;

  beforeEach(function() {
    namespace = new Namespace();
    namespace.elementMap = {};
    namespace.elementDetection = [];
    namespace.useDefault();

    ArrayElement = namespace.getElementClass('array');
    NullElement = namespace.getElementClass('null');
    ObjectElement = namespace.getElementClass('object');
    StringElement = namespace.getElementClass('string');
  });

  it('is exposed on the module', function() {
    expect(minim.Namespace).to.equal(Namespace);
  });

  it('gets returned from minim.namespace()', function() {
    expect(minim.namespace()).to.be.an.instanceof(Namespace);
  });

  it('can set default refracted attributes', function() {
    namespace._attributeElementKeys.push('foo');
    namespace._attributeElementArrayKeys.push('bar');

    var instance = new StringElement('');

    expect(instance._attributeElementKeys).to.deep.equal(['foo']);
    expect(instance._attributeElementArrayKeys).to.deep.equal(['bar']);
  });

  describe('default elements', function() {
    it('are present by default', function() {
      expect(namespace.elementMap).to.not.be.empty();
    });

    it('can be created empty', function() {
      expect((new Namespace({noDefault: true})).elementMap).to.deep.equal({});
    });

    it('can be added after instantiation', function() {
      var testnamespace = new Namespace({noDefault: true});
      testnamespace.useDefault();
      expect(testnamespace.elementMap).to.not.be.empty();
    });
  });

  describe('#use', function() {
    it('can load a plugin module using the namespace property', function() {
      var plugin = {
        namespace: function(options) {
          var base = options.base;

          // Register a new element
          base.register('null2', NullElement);
        }
      };

      namespace.use(plugin);

      expect(namespace.elementMap).to.have.property('null2', NullElement);
    });

    it('can load a plugin module using the load property', function() {
      var plugin = {
        load: function(options) {
          var base = options.base;

          // Register a new element
          base.register('null3', NullElement);
        }
      };

      namespace.use(plugin);

      expect(namespace.elementMap).to.have.property('null3', NullElement);
    });
  });

  describe('#register', function() {
    it('should add to the element map', function() {
      namespace.register('test', ObjectElement);
      expect(namespace.elementMap.test).to.equal(ObjectElement);
    });
  });

  describe('#unregister', function() {
    it('should remove from the element map', function() {
      namespace.unregister('test');
      expect(namespace.elementMap).to.not.have.key('test');
    });
  });

  describe('#detect', function() {
    var test = function() { return true; }

    it('should prepend by default', function() {
      namespace.elementDetection = [[test, NullElement]];
      namespace.detect(test, StringElement);
      expect(namespace.elementDetection[0][1]).to.equal(StringElement);
    });

    it('should be able to append', function() {
      namespace.elementDetection = [[test, NullElement]];
      namespace.detect(test, ObjectElement, false);
      expect(namespace.elementDetection[1][1]).to.equal(ObjectElement);
    });
  });

  describe('#toElement', function() {
    it('should handle values that are ElementClass subclass instances', function() {
      var myElement = new StringElement();
      var converted = namespace.toElement(myElement);

      expect(converted).to.equal(myElement);
    });

    it('should allow for roundtrip conversions for values', function() {
      namespace.register('foo', StringElement);

      // Full version
      var fullVersion = namespace.fromRefract({ element: 'foo', meta: {}, attributes: {}, content: 'test' }).toRefract();
      expect(fullVersion).to.deep.equal({ element: 'foo', meta: {}, attributes: {}, content: 'test' });

      // Compact version
      var compactValue = namespace.fromCompactRefract(['foo', {}, {}, 'test']).toCompactRefract();
      expect(compactValue).to.deep.equal(['foo', {}, {}, 'test']);
    });

    it('should allow for roundtrip conversions for collection elements', function() {
      namespace.register('foo', ArrayElement);

      var fullRefractSample = {
        element: 'foo',
        meta: {},
        attributes: {},
        content: [
          {
            element: 'string',
            meta: {},
            attributes: {},
            content: 'bar'
          }
        ]
      }

      var compactRefractSample = [
        'foo', {}, {}, [
          ['string', {}, {}, 'bar']
        ]
      ]

      // Full version
      var fullVersion = namespace.fromRefract(fullRefractSample).toRefract();
      expect(fullVersion).to.deep.equal(fullRefractSample);

      // Compact version
      var compactValue = namespace.fromCompactRefract(compactRefractSample).toCompactRefract();
      expect(compactValue).to.deep.equal(compactRefractSample);
    });
  });

  describe('#getElementClass', function() {
    it('should return ElementClass for unknown elements', function() {
      expect(namespace.getElementClass('unknown')).to.equal(namespace.BaseElement);
    });
  });

  describe('#elements', function() {
    it('should contain registered element classes', function () {
      var elements = namespace.elements;

      var elementValues = Object.keys(elements).map(function (name) {
        return elements[name];
      });
      elementValues.shift();

      var mapValues = Object.keys(namespace.elementMap).map(function (name) {
        return namespace.elementMap[name];
      });

      expect(elementValues).to.deep.equal(mapValues);
    });

    it('should use pascal casing', function () {
      for (var name in namespace.elements) {
        expect(name[0]).to.equal(name[0].toUpperCase());
      }
    });

    it('should contain the base element', function () {
      expect(namespace.elements.BaseElement).to.equal(namespace.BaseElement);
    });
  });
});
