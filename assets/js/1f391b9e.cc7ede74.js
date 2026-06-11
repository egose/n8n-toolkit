"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["182"], {
6871(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.d(__webpack_exports__, {
  A: () => (AdmonitionWrapper)
});
/* import */ var react_jsx_runtime__rspack_import_0 = __webpack_require__(4934);
/* import */ var react__rspack_import_1 = __webpack_require__(2086);
/* import */ var _theme_original_Admonition__rspack_import_2 = __webpack_require__(562);



function AdmonitionWrapper(props) {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)(react_jsx_runtime__rspack_import_0.Fragment, {
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                className: "text-right -mb-10 mr-2",
                children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("button", {
                    className: "cursor-pointer",
                    onClick: (event)=>{
                        const btn = event.currentTarget;
                        const siblingDiv = btn.parentElement?.nextElementSibling;
                        if (!(siblingDiv instanceof HTMLElement)) {
                            return;
                        }
                        const contentElm = siblingDiv.querySelector('p > strong');
                        if (contentElm) {
                            const text = contentElm.textContent;
                            if (!text || typeof SpeechSynthesisUtterance === 'undefined') {
                                return;
                            }
                            const utterance = new SpeechSynthesisUtterance(text);
                            utterance.lang = 'en-US';
                            speechSynthesis.speak(utterance);
                        }
                    },
                    children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("svg", {
                        xmlns: "http://www.w3.org/2000/svg",
                        width: "24",
                        height: "24",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "2",
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        className: "icon icon-tabler icons-tabler-outline icon-tabler-volume",
                        children: [
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("path", {
                                stroke: "none",
                                d: "M0 0h24v24H0z",
                                fill: "none"
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("path", {
                                d: "M15 8a5 5 0 0 1 0 8"
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("path", {
                                d: "M17.7 5a9 9 0 0 1 0 14"
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("path", {
                                d: "M6 15h-2a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h2l3.5 -4.5a.8 .8 0 0 1 1.5 .5v14a.8 .8 0 0 1 -1.5 .5l-3.5 -4.5"
                            })
                        ]
                    })
                })
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(_theme_original_Admonition__rspack_import_2/* ["default"] */.A, {
                ...props
            })
        ]
    });
}


},

}]);