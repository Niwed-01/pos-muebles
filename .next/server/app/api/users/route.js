"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/users/route";
exports.ids = ["app/api/users/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "node:buffer":
/*!******************************!*\
  !*** external "node:buffer" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("node:buffer");

/***/ }),

/***/ "node:crypto":
/*!******************************!*\
  !*** external "node:crypto" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("node:crypto");

/***/ }),

/***/ "node:util":
/*!****************************!*\
  !*** external "node:util" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("node:util");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fusers%2Froute&page=%2Fapi%2Fusers%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fusers%2Froute.ts&appDir=C%3A%5CUsers%5CEdwin%20Manuel%5CDesktop%5Cpos-muebles%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CEdwin%20Manuel%5CDesktop%5Cpos-muebles&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fusers%2Froute&page=%2Fapi%2Fusers%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fusers%2Froute.ts&appDir=C%3A%5CUsers%5CEdwin%20Manuel%5CDesktop%5Cpos-muebles%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CEdwin%20Manuel%5CDesktop%5Cpos-muebles&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_Edwin_Manuel_Desktop_pos_muebles_app_api_users_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/users/route.ts */ \"(rsc)/./app/api/users/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/users/route\",\n        pathname: \"/api/users\",\n        filename: \"route\",\n        bundlePath: \"app/api/users/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\Edwin Manuel\\\\Desktop\\\\pos-muebles\\\\app\\\\api\\\\users\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_Edwin_Manuel_Desktop_pos_muebles_app_api_users_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/users/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZ1c2VycyUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGdXNlcnMlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZ1c2VycyUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNFZHdpbiUyME1hbnVlbCU1Q0Rlc2t0b3AlNUNwb3MtbXVlYmxlcyU1Q2FwcCZwYWdlRXh0ZW5zaW9ucz10c3gmcGFnZUV4dGVuc2lvbnM9dHMmcGFnZUV4dGVuc2lvbnM9anN4JnBhZ2VFeHRlbnNpb25zPWpzJnJvb3REaXI9QyUzQSU1Q1VzZXJzJTVDRWR3aW4lMjBNYW51ZWwlNUNEZXNrdG9wJTVDcG9zLW11ZWJsZXMmaXNEZXY9dHJ1ZSZ0c2NvbmZpZ1BhdGg9dHNjb25maWcuanNvbiZiYXNlUGF0aD0mYXNzZXRQcmVmaXg9Jm5leHRDb25maWdPdXRwdXQ9JnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFzRztBQUN2QztBQUNjO0FBQ3dCO0FBQ3JHO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixnSEFBbUI7QUFDM0M7QUFDQSxjQUFjLHlFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsaUVBQWlFO0FBQ3pFO0FBQ0E7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDdUg7O0FBRXZIIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcG9zLW11ZWJsZXMvPzllNGQiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2Z1dHVyZS9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiQzpcXFxcVXNlcnNcXFxcRWR3aW4gTWFudWVsXFxcXERlc2t0b3BcXFxccG9zLW11ZWJsZXNcXFxcYXBwXFxcXGFwaVxcXFx1c2Vyc1xcXFxyb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvdXNlcnMvcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS91c2Vyc1wiLFxuICAgICAgICBmaWxlbmFtZTogXCJyb3V0ZVwiLFxuICAgICAgICBidW5kbGVQYXRoOiBcImFwcC9hcGkvdXNlcnMvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCJDOlxcXFxVc2Vyc1xcXFxFZHdpbiBNYW51ZWxcXFxcRGVza3RvcFxcXFxwb3MtbXVlYmxlc1xcXFxhcHBcXFxcYXBpXFxcXHVzZXJzXFxcXHJvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuY29uc3Qgb3JpZ2luYWxQYXRobmFtZSA9IFwiL2FwaS91c2Vycy9yb3V0ZVwiO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICBzZXJ2ZXJIb29rcyxcbiAgICAgICAgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBvcmlnaW5hbFBhdGhuYW1lLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fusers%2Froute&page=%2Fapi%2Fusers%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fusers%2Froute.ts&appDir=C%3A%5CUsers%5CEdwin%20Manuel%5CDesktop%5Cpos-muebles%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CEdwin%20Manuel%5CDesktop%5Cpos-muebles&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./app/api/users/route.ts":
/*!********************************!*\
  !*** ./app/api/users/route.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var _lib_db__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/lib/db */ \"(rsc)/./lib/db.ts\");\n/* harmony import */ var _lib_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/utils */ \"(rsc)/./lib/utils.ts\");\n\n\nasync function GET() {\n    try {\n        const user = await (0,_lib_utils__WEBPACK_IMPORTED_MODULE_1__.getAuthUser)();\n        if (user.rol !== \"ADMIN\") {\n            return (0,_lib_utils__WEBPACK_IMPORTED_MODULE_1__.apiResponse)(null, \"Solo administradores pueden listar usuarios\", undefined, 403);\n        }\n        const data = await _lib_db__WEBPACK_IMPORTED_MODULE_0__.db.user.findMany({\n            select: {\n                id: true,\n                nombre: true,\n                email: true,\n                rol: true,\n                activo: true,\n                creadoEn: true\n            },\n            orderBy: {\n                nombre: \"asc\"\n            }\n        });\n        return (0,_lib_utils__WEBPACK_IMPORTED_MODULE_1__.apiResponse)(data);\n    } catch (error) {\n        const message = error instanceof Error ? error.message : \"Error al obtener usuarios\";\n        const status = message === \"No autorizado\" ? 401 : 500;\n        return (0,_lib_utils__WEBPACK_IMPORTED_MODULE_1__.apiResponse)(null, message, undefined, status);\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL3VzZXJzL3JvdXRlLnRzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUE2QjtBQUN5QjtBQUUvQyxlQUFlRztJQUNwQixJQUFJO1FBQ0YsTUFBTUMsT0FBTyxNQUFNRix1REFBV0E7UUFDOUIsSUFBSUUsS0FBS0MsR0FBRyxLQUFLLFNBQVM7WUFDeEIsT0FBT0osdURBQVdBLENBQUMsTUFBTSwrQ0FBK0NLLFdBQVc7UUFDckY7UUFFQSxNQUFNQyxPQUFPLE1BQU1QLHVDQUFFQSxDQUFDSSxJQUFJLENBQUNJLFFBQVEsQ0FBQztZQUNsQ0MsUUFBUTtnQkFDTkMsSUFBSTtnQkFDSkMsUUFBUTtnQkFDUkMsT0FBTztnQkFDUFAsS0FBSztnQkFDTFEsUUFBUTtnQkFDUkMsVUFBVTtZQUNaO1lBQ0FDLFNBQVM7Z0JBQUVKLFFBQVE7WUFBTTtRQUMzQjtRQUVBLE9BQU9WLHVEQUFXQSxDQUFDTTtJQUNyQixFQUFFLE9BQU9TLE9BQU87UUFDZCxNQUFNQyxVQUFVRCxpQkFBaUJFLFFBQVFGLE1BQU1DLE9BQU8sR0FBRztRQUN6RCxNQUFNRSxTQUFTRixZQUFZLGtCQUFrQixNQUFNO1FBQ25ELE9BQU9oQix1REFBV0EsQ0FBQyxNQUFNZ0IsU0FBU1gsV0FBV2E7SUFDL0M7QUFDRiIsInNvdXJjZXMiOlsid2VicGFjazovL3Bvcy1tdWVibGVzLy4vYXBwL2FwaS91c2Vycy9yb3V0ZS50cz83ZmIxIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGRiIH0gZnJvbSBcIkAvbGliL2RiXCJcbmltcG9ydCB7IGFwaVJlc3BvbnNlLCBnZXRBdXRoVXNlciB9IGZyb20gXCJAL2xpYi91dGlsc1wiXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQoKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgdXNlciA9IGF3YWl0IGdldEF1dGhVc2VyKClcbiAgICBpZiAodXNlci5yb2wgIT09IFwiQURNSU5cIikge1xuICAgICAgcmV0dXJuIGFwaVJlc3BvbnNlKG51bGwsIFwiU29sbyBhZG1pbmlzdHJhZG9yZXMgcHVlZGVuIGxpc3RhciB1c3Vhcmlvc1wiLCB1bmRlZmluZWQsIDQwMylcbiAgICB9XG5cbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZGIudXNlci5maW5kTWFueSh7XG4gICAgICBzZWxlY3Q6IHtcbiAgICAgICAgaWQ6IHRydWUsXG4gICAgICAgIG5vbWJyZTogdHJ1ZSxcbiAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICAgIHJvbDogdHJ1ZSxcbiAgICAgICAgYWN0aXZvOiB0cnVlLFxuICAgICAgICBjcmVhZG9FbjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBvcmRlckJ5OiB7IG5vbWJyZTogXCJhc2NcIiB9LFxuICAgIH0pXG5cbiAgICByZXR1cm4gYXBpUmVzcG9uc2UoZGF0YSlcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zdCBtZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBcIkVycm9yIGFsIG9idGVuZXIgdXN1YXJpb3NcIlxuICAgIGNvbnN0IHN0YXR1cyA9IG1lc3NhZ2UgPT09IFwiTm8gYXV0b3JpemFkb1wiID8gNDAxIDogNTAwXG4gICAgcmV0dXJuIGFwaVJlc3BvbnNlKG51bGwsIG1lc3NhZ2UsIHVuZGVmaW5lZCwgc3RhdHVzKVxuICB9XG59XG4iXSwibmFtZXMiOlsiZGIiLCJhcGlSZXNwb25zZSIsImdldEF1dGhVc2VyIiwiR0VUIiwidXNlciIsInJvbCIsInVuZGVmaW5lZCIsImRhdGEiLCJmaW5kTWFueSIsInNlbGVjdCIsImlkIiwibm9tYnJlIiwiZW1haWwiLCJhY3Rpdm8iLCJjcmVhZG9FbiIsIm9yZGVyQnkiLCJlcnJvciIsIm1lc3NhZ2UiLCJFcnJvciIsInN0YXR1cyJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/users/route.ts\n");

/***/ }),

/***/ "(rsc)/./lib/auth.ts":
/*!*********************!*\
  !*** ./lib/auth.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   auth: () => (/* binding */ auth),\n/* harmony export */   handlers: () => (/* binding */ handlers),\n/* harmony export */   signIn: () => (/* binding */ signIn),\n/* harmony export */   signOut: () => (/* binding */ signOut)\n/* harmony export */ });\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/./node_modules/bcryptjs/index.js\");\n/* harmony import */ var _lib_db__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/lib/db */ \"(rsc)/./lib/db.ts\");\n\n\n\n\nconst { handlers, signIn, signOut, auth } = (0,next_auth__WEBPACK_IMPORTED_MODULE_0__[\"default\"])({\n    providers: [\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_1__[\"default\"])({\n            name: \"credentials\",\n            credentials: {\n                email: {\n                    label: \"Email\",\n                    type: \"email\"\n                },\n                password: {\n                    label: \"Password\",\n                    type: \"password\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.email || !credentials?.password) return null;\n                const user = await _lib_db__WEBPACK_IMPORTED_MODULE_3__.db.user.findUnique({\n                    where: {\n                        email: credentials.email\n                    }\n                });\n                if (!user || !user.activo) return null;\n                const isValid = await (0,bcryptjs__WEBPACK_IMPORTED_MODULE_2__.compare)(credentials.password, user.passwordHash);\n                if (!isValid) return null;\n                return {\n                    id: user.id,\n                    email: user.email,\n                    name: user.nombre,\n                    rol: user.rol\n                };\n            }\n        })\n    ],\n    pages: {\n        signIn: \"/login\"\n    },\n    callbacks: {\n        async jwt ({ token, user }) {\n            if (user) {\n                token.id = user.id;\n                token.rol = user.rol;\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            if (session.user) {\n                session.user.id = token.id;\n                session.user.rol = token.rol;\n            }\n            return session;\n        }\n    }\n});\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvYXV0aC50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFnQztBQUN5QjtBQUN2QjtBQUNMO0FBRXRCLE1BQU0sRUFBRUksUUFBUSxFQUFFQyxNQUFNLEVBQUVDLE9BQU8sRUFBRUMsSUFBSSxFQUFFLEdBQUdQLHFEQUFRQSxDQUFDO0lBQzFEUSxXQUFXO1FBQ1RQLDJFQUFXQSxDQUFDO1lBQ1ZRLE1BQU07WUFDTkMsYUFBYTtnQkFDWEMsT0FBTztvQkFBRUMsT0FBTztvQkFBU0MsTUFBTTtnQkFBUTtnQkFDdkNDLFVBQVU7b0JBQUVGLE9BQU87b0JBQVlDLE1BQU07Z0JBQVc7WUFDbEQ7WUFDQSxNQUFNRSxXQUFVTCxXQUFXO2dCQUN6QixJQUFJLENBQUNBLGFBQWFDLFNBQVMsQ0FBQ0QsYUFBYUksVUFBVSxPQUFPO2dCQUMxRCxNQUFNRSxPQUFPLE1BQU1iLHVDQUFFQSxDQUFDYSxJQUFJLENBQUNDLFVBQVUsQ0FBQztvQkFDcENDLE9BQU87d0JBQUVQLE9BQU9ELFlBQVlDLEtBQUs7b0JBQVc7Z0JBQzlDO2dCQUNBLElBQUksQ0FBQ0ssUUFBUSxDQUFDQSxLQUFLRyxNQUFNLEVBQUUsT0FBTztnQkFDbEMsTUFBTUMsVUFBVSxNQUFNbEIsaURBQU9BLENBQUNRLFlBQVlJLFFBQVEsRUFBWUUsS0FBS0ssWUFBWTtnQkFDL0UsSUFBSSxDQUFDRCxTQUFTLE9BQU87Z0JBQ3JCLE9BQU87b0JBQUVFLElBQUlOLEtBQUtNLEVBQUU7b0JBQUVYLE9BQU9LLEtBQUtMLEtBQUs7b0JBQUVGLE1BQU1PLEtBQUtPLE1BQU07b0JBQUVDLEtBQUtSLEtBQUtRLEdBQUc7Z0JBQUM7WUFDNUU7UUFDRjtLQUNEO0lBQ0RDLE9BQU87UUFBRXBCLFFBQVE7SUFBUztJQUMxQnFCLFdBQVc7UUFDVCxNQUFNQyxLQUFJLEVBQUVDLEtBQUssRUFBRVosSUFBSSxFQUFFO1lBQ3ZCLElBQUlBLE1BQU07Z0JBQ1JZLE1BQU1OLEVBQUUsR0FBR04sS0FBS00sRUFBRTtnQkFDbEJNLE1BQU1KLEdBQUcsR0FBRyxLQUEwQkEsR0FBRztZQUMzQztZQUNBLE9BQU9JO1FBQ1Q7UUFDQSxNQUFNQyxTQUFRLEVBQUVBLE9BQU8sRUFBRUQsS0FBSyxFQUFFO1lBQzlCLElBQUlDLFFBQVFiLElBQUksRUFBRTtnQkFDaEJhLFFBQVFiLElBQUksQ0FBQ00sRUFBRSxHQUFHTSxNQUFNTixFQUFFO2dCQUMxQk8sUUFBUWIsSUFBSSxDQUFDUSxHQUFHLEdBQUdJLE1BQU1KLEdBQUc7WUFDOUI7WUFDQSxPQUFPSztRQUNUO0lBQ0Y7QUFDRixHQUFFIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcG9zLW11ZWJsZXMvLi9saWIvYXV0aC50cz9iZjdlIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBOZXh0QXV0aCBmcm9tIFwibmV4dC1hdXRoXCJcbmltcG9ydCBDcmVkZW50aWFscyBmcm9tIFwibmV4dC1hdXRoL3Byb3ZpZGVycy9jcmVkZW50aWFsc1wiXG5pbXBvcnQgeyBjb21wYXJlIH0gZnJvbSBcImJjcnlwdGpzXCJcbmltcG9ydCB7IGRiIH0gZnJvbSBcIkAvbGliL2RiXCJcblxuZXhwb3J0IGNvbnN0IHsgaGFuZGxlcnMsIHNpZ25Jbiwgc2lnbk91dCwgYXV0aCB9ID0gTmV4dEF1dGgoe1xuICBwcm92aWRlcnM6IFtcbiAgICBDcmVkZW50aWFscyh7XG4gICAgICBuYW1lOiBcImNyZWRlbnRpYWxzXCIsXG4gICAgICBjcmVkZW50aWFsczoge1xuICAgICAgICBlbWFpbDogeyBsYWJlbDogXCJFbWFpbFwiLCB0eXBlOiBcImVtYWlsXCIgfSxcbiAgICAgICAgcGFzc3dvcmQ6IHsgbGFiZWw6IFwiUGFzc3dvcmRcIiwgdHlwZTogXCJwYXNzd29yZFwiIH0sXG4gICAgICB9LFxuICAgICAgYXN5bmMgYXV0aG9yaXplKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgIGlmICghY3JlZGVudGlhbHM/LmVtYWlsIHx8ICFjcmVkZW50aWFscz8ucGFzc3dvcmQpIHJldHVybiBudWxsXG4gICAgICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBkYi51c2VyLmZpbmRVbmlxdWUoe1xuICAgICAgICAgIHdoZXJlOiB7IGVtYWlsOiBjcmVkZW50aWFscy5lbWFpbCBhcyBzdHJpbmcgfSxcbiAgICAgICAgfSlcbiAgICAgICAgaWYgKCF1c2VyIHx8ICF1c2VyLmFjdGl2bykgcmV0dXJuIG51bGxcbiAgICAgICAgY29uc3QgaXNWYWxpZCA9IGF3YWl0IGNvbXBhcmUoY3JlZGVudGlhbHMucGFzc3dvcmQgYXMgc3RyaW5nLCB1c2VyLnBhc3N3b3JkSGFzaClcbiAgICAgICAgaWYgKCFpc1ZhbGlkKSByZXR1cm4gbnVsbFxuICAgICAgICByZXR1cm4geyBpZDogdXNlci5pZCwgZW1haWw6IHVzZXIuZW1haWwsIG5hbWU6IHVzZXIubm9tYnJlLCByb2w6IHVzZXIucm9sIH1cbiAgICAgIH0sXG4gICAgfSksXG4gIF0sXG4gIHBhZ2VzOiB7IHNpZ25JbjogXCIvbG9naW5cIiB9LFxuICBjYWxsYmFja3M6IHtcbiAgICBhc3luYyBqd3QoeyB0b2tlbiwgdXNlciB9KSB7XG4gICAgICBpZiAodXNlcikge1xuICAgICAgICB0b2tlbi5pZCA9IHVzZXIuaWRcbiAgICAgICAgdG9rZW4ucm9sID0gKHVzZXIgYXMgeyByb2w6IHN0cmluZyB9KS5yb2xcbiAgICAgIH1cbiAgICAgIHJldHVybiB0b2tlblxuICAgIH0sXG4gICAgYXN5bmMgc2Vzc2lvbih7IHNlc3Npb24sIHRva2VuIH0pIHtcbiAgICAgIGlmIChzZXNzaW9uLnVzZXIpIHtcbiAgICAgICAgc2Vzc2lvbi51c2VyLmlkID0gdG9rZW4uaWQgYXMgc3RyaW5nXG4gICAgICAgIHNlc3Npb24udXNlci5yb2wgPSB0b2tlbi5yb2wgYXMgc3RyaW5nXG4gICAgICB9XG4gICAgICByZXR1cm4gc2Vzc2lvblxuICAgIH0sXG4gIH0sXG59KVxuIl0sIm5hbWVzIjpbIk5leHRBdXRoIiwiQ3JlZGVudGlhbHMiLCJjb21wYXJlIiwiZGIiLCJoYW5kbGVycyIsInNpZ25JbiIsInNpZ25PdXQiLCJhdXRoIiwicHJvdmlkZXJzIiwibmFtZSIsImNyZWRlbnRpYWxzIiwiZW1haWwiLCJsYWJlbCIsInR5cGUiLCJwYXNzd29yZCIsImF1dGhvcml6ZSIsInVzZXIiLCJmaW5kVW5pcXVlIiwid2hlcmUiLCJhY3Rpdm8iLCJpc1ZhbGlkIiwicGFzc3dvcmRIYXNoIiwiaWQiLCJub21icmUiLCJyb2wiLCJwYWdlcyIsImNhbGxiYWNrcyIsImp3dCIsInRva2VuIiwic2Vzc2lvbiJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./lib/auth.ts\n");

/***/ }),

/***/ "(rsc)/./lib/db.ts":
/*!*******************!*\
  !*** ./lib/db.ts ***!
  \*******************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   db: () => (/* binding */ db)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\nconst globalForPrisma = globalThis;\nconst db = globalForPrisma.prisma ?? new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient();\nif (true) globalForPrisma.prisma = db;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvZGIudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQTZDO0FBRTdDLE1BQU1DLGtCQUFrQkM7QUFJakIsTUFBTUMsS0FBS0YsZ0JBQWdCRyxNQUFNLElBQUksSUFBSUosd0RBQVlBLEdBQUU7QUFFOUQsSUFBSUssSUFBcUMsRUFBRUosZ0JBQWdCRyxNQUFNLEdBQUdEIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcG9zLW11ZWJsZXMvLi9saWIvZGIudHM/MWRmMCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tIFwiQHByaXNtYS9jbGllbnRcIlxuXG5jb25zdCBnbG9iYWxGb3JQcmlzbWEgPSBnbG9iYWxUaGlzIGFzIHVua25vd24gYXMge1xuICBwcmlzbWE6IFByaXNtYUNsaWVudCB8IHVuZGVmaW5lZFxufVxuXG5leHBvcnQgY29uc3QgZGIgPSBnbG9iYWxGb3JQcmlzbWEucHJpc21hID8/IG5ldyBQcmlzbWFDbGllbnQoKVxuXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiKSBnbG9iYWxGb3JQcmlzbWEucHJpc21hID0gZGJcbiJdLCJuYW1lcyI6WyJQcmlzbWFDbGllbnQiLCJnbG9iYWxGb3JQcmlzbWEiLCJnbG9iYWxUaGlzIiwiZGIiLCJwcmlzbWEiLCJwcm9jZXNzIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./lib/db.ts\n");

/***/ }),

/***/ "(rsc)/./lib/utils.ts":
/*!**********************!*\
  !*** ./lib/utils.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   apiResponse: () => (/* binding */ apiResponse),\n/* harmony export */   getAuthUser: () => (/* binding */ getAuthUser)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/auth */ \"(rsc)/./lib/auth.ts\");\n\n\nfunction apiResponse(data = null, error = null, message = null, status = 200) {\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        data,\n        error,\n        message\n    }, {\n        status\n    });\n}\nasync function getAuthUser() {\n    const session = await (0,_lib_auth__WEBPACK_IMPORTED_MODULE_1__.auth)();\n    if (!session?.user?.id) {\n        throw new Error(\"No autorizado\");\n    }\n    return session.user;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9saWIvdXRpbHMudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUEwQztBQUNUO0FBRTFCLFNBQVNFLFlBQ2RDLE9BQWlCLElBQUksRUFDckJDLFFBQXVCLElBQUksRUFDM0JDLFVBQXlCLElBQUksRUFDN0JDLFNBQVMsR0FBRztJQUVaLE9BQU9OLHFEQUFZQSxDQUFDTyxJQUFJLENBQUM7UUFBRUo7UUFBTUM7UUFBT0M7SUFBUSxHQUFHO1FBQUVDO0lBQU87QUFDOUQ7QUFFTyxlQUFlRTtJQUNwQixNQUFNQyxVQUFVLE1BQU1SLCtDQUFJQTtJQUMxQixJQUFJLENBQUNRLFNBQVNDLE1BQU1DLElBQUk7UUFDdEIsTUFBTSxJQUFJQyxNQUFNO0lBQ2xCO0lBQ0EsT0FBT0gsUUFBUUMsSUFBSTtBQUNyQiIsInNvdXJjZXMiOlsid2VicGFjazovL3Bvcy1tdWVibGVzLy4vbGliL3V0aWxzLnRzP2Y3NDUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dFJlc3BvbnNlIH0gZnJvbSBcIm5leHQvc2VydmVyXCJcbmltcG9ydCB7IGF1dGggfSBmcm9tIFwiQC9saWIvYXV0aFwiXG5cbmV4cG9ydCBmdW5jdGlvbiBhcGlSZXNwb25zZTxUID0gdW5rbm93bj4oXG4gIGRhdGE6IFQgfCBudWxsID0gbnVsbCxcbiAgZXJyb3I6IHN0cmluZyB8IG51bGwgPSBudWxsLFxuICBtZXNzYWdlOiBzdHJpbmcgfCBudWxsID0gbnVsbCxcbiAgc3RhdHVzID0gMjAwXG4pIHtcbiAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZGF0YSwgZXJyb3IsIG1lc3NhZ2UgfSwgeyBzdGF0dXMgfSlcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEF1dGhVc2VyKCkge1xuICBjb25zdCBzZXNzaW9uID0gYXdhaXQgYXV0aCgpXG4gIGlmICghc2Vzc2lvbj8udXNlcj8uaWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBhdXRvcml6YWRvXCIpXG4gIH1cbiAgcmV0dXJuIHNlc3Npb24udXNlciBhcyB7IGlkOiBzdHJpbmc7IGVtYWlsOiBzdHJpbmc7IG5hbWU6IHN0cmluZzsgcm9sOiBzdHJpbmcgfVxufVxuIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsImF1dGgiLCJhcGlSZXNwb25zZSIsImRhdGEiLCJlcnJvciIsIm1lc3NhZ2UiLCJzdGF0dXMiLCJqc29uIiwiZ2V0QXV0aFVzZXIiLCJzZXNzaW9uIiwidXNlciIsImlkIiwiRXJyb3IiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./lib/utils.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@auth","vendor-chunks/next-auth","vendor-chunks/oauth4webapi","vendor-chunks/jose","vendor-chunks/bcryptjs","vendor-chunks/preact","vendor-chunks/cookie","vendor-chunks/preact-render-to-string","vendor-chunks/@panva"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fusers%2Froute&page=%2Fapi%2Fusers%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fusers%2Froute.ts&appDir=C%3A%5CUsers%5CEdwin%20Manuel%5CDesktop%5Cpos-muebles%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CEdwin%20Manuel%5CDesktop%5Cpos-muebles&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();