/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/is-arrayish";
exports.ids = ["vendor-chunks/is-arrayish"];
exports.modules = {

/***/ "(ssr)/./node_modules/is-arrayish/index.js":
/*!*******************************************!*\
  !*** ./node_modules/is-arrayish/index.js ***!
  \*******************************************/
/***/ ((module) => {

eval("module.exports = function isArrayish(obj) {\n    if (!obj || typeof obj === \"string\") {\n        return false;\n    }\n    return obj instanceof Array || Array.isArray(obj) || obj.length >= 0 && (obj.splice instanceof Function || Object.getOwnPropertyDescriptor(obj, obj.length - 1) && obj.constructor.name !== \"String\");\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9xb2duaXRhLy4vbm9kZV9tb2R1bGVzL2lzLWFycmF5aXNoL2luZGV4LmpzP2JlNDEiXSwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0FycmF5aXNoKG9iaikge1xuXHRpZiAoIW9iaiB8fCB0eXBlb2Ygb2JqID09PSAnc3RyaW5nJykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdHJldHVybiBvYmogaW5zdGFuY2VvZiBBcnJheSB8fCBBcnJheS5pc0FycmF5KG9iaikgfHxcblx0XHQob2JqLmxlbmd0aCA+PSAwICYmIChvYmouc3BsaWNlIGluc3RhbmNlb2YgRnVuY3Rpb24gfHxcblx0XHRcdChPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iaiwgKG9iai5sZW5ndGggLSAxKSkgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgIT09ICdTdHJpbmcnKSkpO1xufTtcbiJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwiaXNBcnJheWlzaCIsIm9iaiIsIkFycmF5IiwiaXNBcnJheSIsImxlbmd0aCIsInNwbGljZSIsIkZ1bmN0aW9uIiwiT2JqZWN0IiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwiY29uc3RydWN0b3IiLCJuYW1lIl0sIm1hcHBpbmdzIjoiQUFBQUEsT0FBT0MsT0FBTyxHQUFHLFNBQVNDLFdBQVdDLEdBQUc7SUFDdkMsSUFBSSxDQUFDQSxPQUFPLE9BQU9BLFFBQVEsVUFBVTtRQUNwQyxPQUFPO0lBQ1I7SUFFQSxPQUFPQSxlQUFlQyxTQUFTQSxNQUFNQyxPQUFPLENBQUNGLFFBQzNDQSxJQUFJRyxNQUFNLElBQUksS0FBTUgsQ0FBQUEsSUFBSUksTUFBTSxZQUFZQyxZQUN6Q0MsT0FBT0Msd0JBQXdCLENBQUNQLEtBQU1BLElBQUlHLE1BQU0sR0FBRyxNQUFPSCxJQUFJUSxXQUFXLENBQUNDLElBQUksS0FBSyxRQUFRO0FBQy9GIiwiZmlsZSI6Iihzc3IpLy4vbm9kZV9tb2R1bGVzL2lzLWFycmF5aXNoL2luZGV4LmpzIiwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/is-arrayish/index.js\n");

/***/ })

};
;