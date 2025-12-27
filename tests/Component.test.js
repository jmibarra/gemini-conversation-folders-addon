import Component from '../src/scripts/core/Component.js';

describe('Component', () => {
    class TestComponent extends Component {
        render() {
            return '<div id="test">Hello World</div>';
        }
    }

    let component;

    beforeEach(() => {
        component = new TestComponent({ id: 1 });
    });

    test('constructor sets props', () => {
        expect(component.props).toEqual({ id: 1 });
        expect(component.state).toEqual({});
    });

    test('render must be implemented', () => {
        const base = new Component();
        expect(() => base.render()).toThrow('Component.render() must be implemented');
    });

    test('create generates DOM element', () => {
        const el = component.create();
        expect(el.tagName).toBe('DIV');
        expect(el.id).toBe('test');
        expect(el.textContent).toBe('Hello World');
        expect(component.element).toBe(el);
    });

    test('setState updates state and re-renders', () => {
        component.create(); // Initial render
        const updateSpy = jest.spyOn(component, 'update');
        
        component.setState({ active: true });
        
        expect(component.state.active).toBe(true);
        expect(updateSpy).toHaveBeenCalled();
    });

    test('mount appends to container', () => {
        const container = document.createElement('div');
        component.mount(container);
        
        expect(container.children.length).toBe(1);
        expect(container.firstChild.id).toBe('test');
    });

    test('afterRender is called after create', () => {
        const spy = jest.spyOn(component, 'afterRender');
        component.create();
        expect(spy).toHaveBeenCalled();
    });
});
