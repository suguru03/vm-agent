'use strict';
const result = (async () => {
  const val = await new Promise(resolve => setTimeout(resolve, 10));
  return val;
})();
