import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';
import Heading from '@theme/Heading';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const snippet = `import { init } from 'thorvg-canvas';

const TVG = await init();
const canvas = new TVG.Canvas({ width: 512, height: 512 });

const animation = new TVG.LottieAnimation().load(lottieJson);
const picture = animation.picture!;
picture.size(512, 512);
canvas.add(picture);

animation.frame(30);
await canvas.renderAsync();
await canvas.toFile('thumbnail.png');`;

const features: { title: string; body: ReactNode }[] = [
  {
    title: 'WebCanvas API',
    body: (
      <>
        The <Link href="https://www.npmjs.com/package/@thorvg/webcanvas">@thorvg/webcanvas</Link> API
        in Node.js. Drawing code written for the browser runs on the server as is.
      </>
    ),
  },
  {
    title: 'Native and headless',
    body: 'ThorVG runs natively through Node-API and renders on the CPU into memory.',
  },
  {
    title: 'Vector, Lottie, SVG and text',
    body: 'Shapes, gradients, masks, scene effects, Lottie animations with slots and markers, SVG, PNG, JPG and WebP pictures, and TrueType or OpenType text. Save frames as PNG or read the raw pixels.',
  },
];

export default function Home() {
  return (
    <Layout description="ThorVG vector graphics and Lottie for Node.js">
      <header className={styles.hero}>
        <div className="container">
          <Heading as="h1" className={styles.title}>
            ThorVG for Node.js
          </Heading>
          <p className={styles.tagline}>Headless vector graphics and Lottie rendering for Node.js.</p>
          <div className={styles.buttons}>
            <Link className="button button--primary button--lg" to="/docs/getting-started">
              Get started
            </Link>
            <Link className="button button--secondary button--lg" to="/docs/examples">
              Examples
            </Link>
          </div>
          <div className={styles.snippet}>
            <CodeBlock language="ts">{snippet}</CodeBlock>
          </div>
        </div>
      </header>
      <main className="container">
        <div className={styles.features}>
          {features.map((feature) => (
            <div key={feature.title} className={styles.feature}>
              <Heading as="h3">{feature.title}</Heading>
              <p>{feature.body}</p>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
}
