import Editor from './editor';
import { render } from 'preact';
import SvgPatterns from './svg-patterns';

function App() {
    return <div>
      <h1>Hello World!</h1>
      <Editor />
			<SvgPatterns />
    </div>;
}

render(<App />, document.body);