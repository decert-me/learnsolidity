import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: '交互式学习',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Decert.me(链习网) 使用交互式学习方法， 你可以直接在教程中修改代码，查看运行效果，学习更高效。
      </>
    ),
  },
  {
    title: '前沿技术',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Decert.me 关注前沿技术，尤其是区块链技术，提供前沿技术一站式学习体验。
      </>
    ),
  },
  {
    title: '技术认证',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        当你通过一个某个技术的测试之后，你可以选择在区块链上生成技能认证记录，永久证明你的能力。
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
