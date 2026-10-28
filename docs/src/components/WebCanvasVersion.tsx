import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function WebCanvasVersion() {
  const { siteConfig } = useDocusaurusContext();
  return <>{String(siteConfig.customFields?.webcanvasVersion)}</>;
}
