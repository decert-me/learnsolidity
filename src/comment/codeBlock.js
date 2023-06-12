const visit = require('unist-util-visit');

const plugin = () => {
  const transformer = async (ast) => {
    visit(ast, 'code', (node) => {
      // 编辑器模式
      if (node.lang === 'SolidityEditor') {
          node.type = 'jsx';
          node.value = `<SolidityEditor code={\`${node.value}\`}/>`;
      }
    });
  };
  return transformer;
};

module.exports = plugin;