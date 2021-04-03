const fs = require('fs');
const path = require('path');

const xlsx = require('node-xlsx');
const lodash = require('lodash');

const workSheetsFromFile = xlsx.parse(path.resolve(__dirname, 'data', 'excel', 'ICD-10-AM ENG-UKR-normalized.xlsx'));
const data = workSheetsFromFile[0].data;
data.shift();

const mapToCode = (data, i, keyIndexes, j) => {
  return {
    code: data[i][keyIndexes[j]],
    descUA: data[i][keyIndexes[j] + 1],
    descENG: data[i][keyIndexes[j] + 2],
    child: [],
  };
};

const pathToSteps = (paths) =>
  paths.map((item, index, array) => {
    return array.slice(0, index + 1).join('/');
  });

const getFullPath = (row, keyIndexes) => {
  const fullKeyPath = keyIndexes
    .reduce((accumulator, currentValue) => `${accumulator}${row[currentValue]}/`, '')
    .split('/');
  fullKeyPath.pop();
  return fullKeyPath;
};

const buildTree = (initialTree, data, end, step) => {
  const keyIndexes = lodash.range(0, end, step);
  let current = lodash.fill([...keyIndexes], '');
  for (let i = 0; i < data.length; i++) {
    let currentTree = lodash.last(initialTree).child;
    for (let j = 0; j < keyIndexes.length; j++) {
      // need to handle such case when 1 level code changed but second level code didn't
      // for example transition from 7 to 8 top level code
      const currentRowPath = getFullPath(data[i], keyIndexes)
        .slice(0, j + 1)
        .join('/');
      if (currentRowPath !== current[j]) {
        if (data[i][keyIndexes[j]] !== '_') {
          currentTree.push(mapToCode(data, i, keyIndexes, j));
        }
      }
      if (lodash.last(currentTree)) {
        currentTree = lodash.last(currentTree).child;
      }
    }
    current = pathToSteps(getFullPath(data[i], keyIndexes));
  }
  return initialTree;
};

const dataTree = [
  {
    code: 'icd10',
    descUA: 'dgdsf',
    descENG: '',
    child: [],
  },
];

const resultTree = buildTree(dataTree, data, data[0].length - 3, 3);

fs.writeFileSync(path.resolve(__dirname, 'data', 'result', 'resultTree.json'), JSON.stringify(resultTree, null, 2));
