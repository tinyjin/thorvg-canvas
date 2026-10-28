import CodeBlock from '@theme/CodeBlock';
import Heading from '@theme/Heading';
import useBaseUrl from '@docusaurus/useBaseUrl';
import examples from '@site/src/data/examples.json';
import styles from './Examples.module.css';

function Example({ name, title, code, image }: (typeof examples)[number]) {
  return (
    <section className={styles.example}>
      <Heading as="h2" id={name}>
        {title}
      </Heading>
      <img className={styles.image} src={useBaseUrl(image)} alt={title} />
      <CodeBlock language="js" title={`examples/${name}.mjs`}>
        {code}
      </CodeBlock>
    </section>
  );
}

export default function Examples() {
  return (
    <>
      {examples.map((example) => (
        <Example key={example.name} {...example} />
      ))}
    </>
  );
}
