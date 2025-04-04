async function splitByData(arr) {
  const groups = arr.reduce((acc, obj) => {
      const data = obj.Timestamp;
      if (!acc[data]) {
          acc[data] = [];
      }
      acc[data].push(obj);
      return acc;
  }, {});

  return Object.values(groups);
}

module.exports ={splitByData}
