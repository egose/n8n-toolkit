"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["9949"], {
562(__unused_rspack_module, __webpack_exports__, __webpack_require__) {

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  A: () => (/* binding */ Admonition)
});

// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/index.js
var react = __webpack_require__(2086);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-common@3.10.0_@docusaurus+plugin-content-docs@3.10.0_@docusaurus+fast_2c7af3544eee2ad1196d844307749877/node_modules/@docusaurus/theme-common/lib/utils/admonitionUtils.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 
// Workaround because it's difficult in MDX v1 to provide a MDX title as props
// See https://github.com/facebook/docusaurus/pull/7152#issuecomment-1145779682
function extractMDXAdmonitionTitle(children) {
    const items = react.Children.toArray(children);
    const mdxAdmonitionTitleWrapper = items.find((item)=>/*#__PURE__*/ react.isValidElement(item) && item.type === 'mdxAdmonitionTitle');
    const rest = items.filter((item)=>item !== mdxAdmonitionTitleWrapper);
    const mdxAdmonitionTitle = mdxAdmonitionTitleWrapper?.props.children;
    return {
        mdxAdmonitionTitle,
        rest: rest.length > 0 ? /*#__PURE__*/ (0,jsx_runtime.jsx)(jsx_runtime.Fragment, {
            children: rest
        }) : null
    };
}
function processAdmonitionProps(props) {
    const { mdxAdmonitionTitle, rest } = extractMDXAdmonitionTitle(props.children);
    const title = props.title ?? mdxAdmonitionTitle;
    return {
        ...props,
        // Do not return "title: undefined" prop
        // this might create unwanted props overrides when merging props
        // For example: {...default,...props}
        ...title && {
            title
        },
        children: rest
    };
} //# sourceMappingURL=admonitionUtils.js.map

// EXTERNAL MODULE: ./node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
var clsx = __webpack_require__(3526);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+core@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@swc+core@1._c9fc87af6c6a9eba42ca6d26121f471f/node_modules/@docusaurus/core/lib/client/exports/Translate.js + 1 modules
var Translate = __webpack_require__(6678);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-common@3.10.0_@docusaurus+plugin-content-docs@3.10.0_@docusaurus+fast_2c7af3544eee2ad1196d844307749877/node_modules/@docusaurus/theme-common/lib/utils/ThemeClassNames.js
var ThemeClassNames = __webpack_require__(9967);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Admonition/Layout/styles.module.css
// extracted by css-extract-rspack-plugin
/* export default */ const styles_module = ({"admonition":"admonition_Ekrm","admonitionHeading":"admonitionHeading_M65k","admonitionIcon":"admonitionIcon_OFLp","admonitionContent":"admonitionContent_knSm"});
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Admonition/Layout/index.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 



function AdmonitionContainer({ type, className, children, id }) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)("div", {
        className: (0,clsx/* ["default"] */.A)(ThemeClassNames/* .ThemeClassNames.common.admonition */.G.common.admonition, ThemeClassNames/* .ThemeClassNames.common.admonitionType */.G.common.admonitionType(type), styles_module.admonition, className),
        id: id,
        children: children
    });
}
function AdmonitionHeading({ icon, title }) {
    return /*#__PURE__*/ (0,jsx_runtime.jsxs)("div", {
        className: styles_module.admonitionHeading,
        children: [
            /*#__PURE__*/ (0,jsx_runtime.jsx)("span", {
                className: styles_module.admonitionIcon,
                children: icon
            }),
            title
        ]
    });
}
function AdmonitionContent({ children }) {
    return children ? /*#__PURE__*/ (0,jsx_runtime.jsx)("div", {
        className: styles_module.admonitionContent,
        children: children
    }) : null;
}
function AdmonitionLayout(props) {
    const { type, icon, title, children, className, id } = props;
    return /*#__PURE__*/ (0,jsx_runtime.jsxs)(AdmonitionContainer, {
        type: type,
        className: className,
        id: id,
        children: [
            title || icon ? /*#__PURE__*/ (0,jsx_runtime.jsx)(AdmonitionHeading, {
                title: title,
                icon: icon
            }) : null,
            /*#__PURE__*/ (0,jsx_runtime.jsx)(AdmonitionContent, {
                children: children
            })
        ]
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Admonition/Icon/Note.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 
function AdmonitionIconNote(props) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)("svg", {
        viewBox: "0 0 14 16",
        ...props,
        children: /*#__PURE__*/ (0,jsx_runtime.jsx)("path", {
            fillRule: "evenodd",
            d: "M6.3 5.69a.942.942 0 0 1-.28-.7c0-.28.09-.52.28-.7.19-.18.42-.28.7-.28.28 0 .52.09.7.28.18.19.28.42.28.7 0 .28-.09.52-.28.7a1 1 0 0 1-.7.3c-.28 0-.52-.11-.7-.3zM8 7.99c-.02-.25-.11-.48-.31-.69-.2-.19-.42-.3-.69-.31H6c-.27.02-.48.13-.69.31-.2.2-.3.44-.31.69h1v3c.02.27.11.5.31.69.2.2.42.31.69.31h1c.27 0 .48-.11.69-.31.2-.19.3-.42.31-.69H8V7.98v.01zM7 2.3c-3.14 0-5.7 2.54-5.7 5.68 0 3.14 2.56 5.7 5.7 5.7s5.7-2.55 5.7-5.7c0-3.15-2.56-5.69-5.7-5.69v.01zM7 .98c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.12-7-7 3.14-7 7-7z"
        })
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Admonition/Type/Note.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 




const infimaClassName = 'alert alert--secondary';
const defaultProps = {
    icon: /*#__PURE__*/ (0,jsx_runtime.jsx)(AdmonitionIconNote, {}),
    title: /*#__PURE__*/ (0,jsx_runtime.jsx)(Translate/* ["default"] */.A, {
        id: "theme.admonition.note",
        description: "The default label used for the Note admonition (:::note)",
        children: "note"
    })
};
function AdmonitionTypeNote(props) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(AdmonitionLayout, {
        ...defaultProps,
        ...props,
        className: (0,clsx/* ["default"] */.A)(infimaClassName, props.className),
        children: props.children
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Admonition/Icon/Tip.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 
function AdmonitionIconTip(props) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)("svg", {
        viewBox: "0 0 12 16",
        ...props,
        children: /*#__PURE__*/ (0,jsx_runtime.jsx)("path", {
            fillRule: "evenodd",
            d: "M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"
        })
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Admonition/Type/Tip.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 




const Tip_infimaClassName = 'alert alert--success';
const Tip_defaultProps = {
    icon: /*#__PURE__*/ (0,jsx_runtime.jsx)(AdmonitionIconTip, {}),
    title: /*#__PURE__*/ (0,jsx_runtime.jsx)(Translate/* ["default"] */.A, {
        id: "theme.admonition.tip",
        description: "The default label used for the Tip admonition (:::tip)",
        children: "tip"
    })
};
function AdmonitionTypeTip(props) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(AdmonitionLayout, {
        ...Tip_defaultProps,
        ...props,
        className: (0,clsx/* ["default"] */.A)(Tip_infimaClassName, props.className),
        children: props.children
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Admonition/Icon/Info.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 
function AdmonitionIconInfo(props) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)("svg", {
        viewBox: "0 0 14 16",
        ...props,
        children: /*#__PURE__*/ (0,jsx_runtime.jsx)("path", {
            fillRule: "evenodd",
            d: "M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"
        })
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Admonition/Type/Info.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 




const Info_infimaClassName = 'alert alert--info';
const Info_defaultProps = {
    icon: /*#__PURE__*/ (0,jsx_runtime.jsx)(AdmonitionIconInfo, {}),
    title: /*#__PURE__*/ (0,jsx_runtime.jsx)(Translate/* ["default"] */.A, {
        id: "theme.admonition.info",
        description: "The default label used for the Info admonition (:::info)",
        children: "info"
    })
};
function AdmonitionTypeInfo(props) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(AdmonitionLayout, {
        ...Info_defaultProps,
        ...props,
        className: (0,clsx/* ["default"] */.A)(Info_infimaClassName, props.className),
        children: props.children
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Admonition/Icon/Warning.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 
function AdmonitionIconCaution(props) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)("svg", {
        viewBox: "0 0 16 16",
        ...props,
        children: /*#__PURE__*/ (0,jsx_runtime.jsx)("path", {
            fillRule: "evenodd",
            d: "M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"
        })
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Admonition/Type/Warning.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 




const Warning_infimaClassName = 'alert alert--warning';
const Warning_defaultProps = {
    icon: /*#__PURE__*/ (0,jsx_runtime.jsx)(AdmonitionIconCaution, {}),
    title: /*#__PURE__*/ (0,jsx_runtime.jsx)(Translate/* ["default"] */.A, {
        id: "theme.admonition.warning",
        description: "The default label used for the Warning admonition (:::warning)",
        children: "warning"
    })
};
function AdmonitionTypeWarning(props) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(AdmonitionLayout, {
        ...Warning_defaultProps,
        ...props,
        className: (0,clsx/* ["default"] */.A)(Warning_infimaClassName, props.className),
        children: props.children
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Admonition/Icon/Danger.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 
function AdmonitionIconDanger(props) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)("svg", {
        viewBox: "0 0 12 16",
        ...props,
        children: /*#__PURE__*/ (0,jsx_runtime.jsx)("path", {
            fillRule: "evenodd",
            d: "M5.05.31c.81 2.17.41 3.38-.52 4.31C3.55 5.67 1.98 6.45.9 7.98c-1.45 2.05-1.7 6.53 3.53 7.7-2.2-1.16-2.67-4.52-.3-6.61-.61 2.03.53 3.33 1.94 2.86 1.39-.47 2.3.53 2.27 1.67-.02.78-.31 1.44-1.13 1.81 3.42-.59 4.78-3.42 4.78-5.56 0-2.84-2.53-3.22-1.25-5.61-1.52.13-2.03 1.13-1.89 2.75.09 1.08-1.02 1.8-1.86 1.33-.67-.41-.66-1.19-.06-1.78C8.18 5.31 8.68 2.45 5.05.32L5.03.3l.02.01z"
        })
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Admonition/Type/Danger.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 




const Danger_infimaClassName = 'alert alert--danger';
const Danger_defaultProps = {
    icon: /*#__PURE__*/ (0,jsx_runtime.jsx)(AdmonitionIconDanger, {}),
    title: /*#__PURE__*/ (0,jsx_runtime.jsx)(Translate/* ["default"] */.A, {
        id: "theme.admonition.danger",
        description: "The default label used for the Danger admonition (:::danger)",
        children: "danger"
    })
};
function AdmonitionTypeDanger(props) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(AdmonitionLayout, {
        ...Danger_defaultProps,
        ...props,
        className: (0,clsx/* ["default"] */.A)(Danger_infimaClassName, props.className),
        children: props.children
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Admonition/Type/Caution.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 




const Caution_infimaClassName = 'alert alert--warning';
const Caution_defaultProps = {
    icon: /*#__PURE__*/ (0,jsx_runtime.jsx)(AdmonitionIconCaution, {}),
    title: /*#__PURE__*/ (0,jsx_runtime.jsx)(Translate/* ["default"] */.A, {
        id: "theme.admonition.caution",
        description: "The default label used for the Caution admonition (:::caution)",
        children: "caution"
    })
};
// TODO remove before v4: Caution replaced by Warning
// see https://github.com/facebook/docusaurus/issues/7558
function AdmonitionTypeCaution(props) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(AdmonitionLayout, {
        ...Caution_defaultProps,
        ...props,
        className: (0,clsx/* ["default"] */.A)(Caution_infimaClassName, props.className),
        children: props.children
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Admonition/Types.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 






const admonitionTypes = {
    note: AdmonitionTypeNote,
    tip: AdmonitionTypeTip,
    info: AdmonitionTypeInfo,
    warning: AdmonitionTypeWarning,
    danger: AdmonitionTypeDanger
};
// Undocumented legacy admonition type aliases
// Provide hardcoded/untranslated retrocompatible label
// See also https://github.com/facebook/docusaurus/issues/7767
const admonitionAliases = {
    secondary: (props)=>/*#__PURE__*/ (0,jsx_runtime.jsx)(AdmonitionTypeNote, {
            title: "secondary",
            ...props
        }),
    important: (props)=>/*#__PURE__*/ (0,jsx_runtime.jsx)(AdmonitionTypeInfo, {
            title: "important",
            ...props
        }),
    success: (props)=>/*#__PURE__*/ (0,jsx_runtime.jsx)(AdmonitionTypeTip, {
            title: "success",
            ...props
        }),
    caution: AdmonitionTypeCaution
};
/* export default */ const Types = ({
    ...admonitionTypes,
    ...admonitionAliases
});

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Admonition/index.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 


function getAdmonitionTypeComponent(type) {
    const component = Types[type];
    if (component) {
        return component;
    }
    console.warn(`No admonition component found for admonition type "${type}". Using Info as fallback.`);
    return Types.info;
}
function Admonition(unprocessedProps) {
    const props = processAdmonitionProps(unprocessedProps);
    const AdmonitionTypeComponent = getAdmonitionTypeComponent(props.type);
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(AdmonitionTypeComponent, {
        ...props
    });
}


},
1514(__unused_rspack_module, __webpack_exports__, __webpack_require__) {

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  A: () => (/* binding */ EditMetaRow)
});

// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/index.js
var react = __webpack_require__(2086);
// EXTERNAL MODULE: ./node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
var clsx = __webpack_require__(3526);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+core@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@swc+core@1._c9fc87af6c6a9eba42ca6d26121f471f/node_modules/@docusaurus/core/lib/client/exports/Translate.js + 1 modules
var Translate = __webpack_require__(6678);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-common@3.10.0_@docusaurus+plugin-content-docs@3.10.0_@docusaurus+fast_2c7af3544eee2ad1196d844307749877/node_modules/@docusaurus/theme-common/lib/utils/ThemeClassNames.js
var ThemeClassNames = __webpack_require__(9967);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+core@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@swc+core@1._c9fc87af6c6a9eba42ca6d26121f471f/node_modules/@docusaurus/core/lib/client/exports/Link.js
var Link = __webpack_require__(1041);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Icon/Edit/styles.module.css
// extracted by css-extract-rspack-plugin
/* export default */ const styles_module = ({"iconEdit":"iconEdit_TZHA"});
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Icon/Edit/index.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 


function IconEdit({ className, ...restProps }) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)("svg", {
        fill: "currentColor",
        height: "20",
        width: "20",
        viewBox: "0 0 40 40",
        className: (0,clsx/* ["default"] */.A)(styles_module.iconEdit, className),
        "aria-hidden": "true",
        ...restProps,
        children: /*#__PURE__*/ (0,jsx_runtime.jsx)("g", {
            children: /*#__PURE__*/ (0,jsx_runtime.jsx)("path", {
                d: "m34.5 11.7l-3 3.1-6.3-6.3 3.1-3q0.5-0.5 1.2-0.5t1.1 0.5l3.9 3.9q0.5 0.4 0.5 1.1t-0.5 1.2z m-29.5 17.1l18.4-18.5 6.3 6.3-18.4 18.4h-6.3v-6.2z"
            })
        })
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/EditThisPage/index.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 




function EditThisPage({ editUrl }) {
    return /*#__PURE__*/ (0,jsx_runtime.jsxs)(Link/* ["default"] */.A, {
        to: editUrl,
        className: ThemeClassNames/* .ThemeClassNames.common.editThisPage */.G.common.editThisPage,
        children: [
            /*#__PURE__*/ (0,jsx_runtime.jsx)(IconEdit, {}),
            /*#__PURE__*/ (0,jsx_runtime.jsx)(Translate/* ["default"] */.A, {
                id: "theme.common.editThisPage",
                description: "The link label to edit the current page",
                children: "Edit this page"
            })
        ]
    });
}

// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-common@3.10.0_@docusaurus+plugin-content-docs@3.10.0_@docusaurus+fast_2c7af3544eee2ad1196d844307749877/node_modules/@docusaurus/theme-common/lib/utils/IntlUtils.js
var IntlUtils = __webpack_require__(658);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/LastUpdated/index.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 



function LastUpdatedAtDate({ lastUpdatedAt }) {
    const atDate = new Date(lastUpdatedAt);
    const dateTimeFormat = (0,IntlUtils/* .useDateTimeFormat */.i)({
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
    });
    const formattedLastUpdatedAt = dateTimeFormat.format(atDate);
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(Translate/* ["default"] */.A, {
        id: "theme.lastUpdated.atDate",
        description: "The words used to describe on which date a page has been last updated",
        values: {
            date: /*#__PURE__*/ (0,jsx_runtime.jsx)("b", {
                children: /*#__PURE__*/ (0,jsx_runtime.jsx)("time", {
                    dateTime: atDate.toISOString(),
                    itemProp: "dateModified",
                    children: formattedLastUpdatedAt
                })
            })
        },
        children: ' on {date}'
    });
}
function LastUpdatedByUser({ lastUpdatedBy }) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(Translate/* ["default"] */.A, {
        id: "theme.lastUpdated.byUser",
        description: "The words used to describe by who the page has been last updated",
        values: {
            user: /*#__PURE__*/ (0,jsx_runtime.jsx)("b", {
                children: lastUpdatedBy
            })
        },
        children: ' by {user}'
    });
}
function LastUpdated({ lastUpdatedAt, lastUpdatedBy }) {
    return /*#__PURE__*/ (0,jsx_runtime.jsxs)("span", {
        className: ThemeClassNames/* .ThemeClassNames.common.lastUpdated */.G.common.lastUpdated,
        children: [
            /*#__PURE__*/ (0,jsx_runtime.jsx)(Translate/* ["default"] */.A, {
                id: "theme.lastUpdated.lastUpdatedAtBy",
                description: "The sentence used to display when a page has been last updated, and by who",
                values: {
                    atDate: lastUpdatedAt ? /*#__PURE__*/ (0,jsx_runtime.jsx)(LastUpdatedAtDate, {
                        lastUpdatedAt: lastUpdatedAt
                    }) : '',
                    byUser: lastUpdatedBy ? /*#__PURE__*/ (0,jsx_runtime.jsx)(LastUpdatedByUser, {
                        lastUpdatedBy: lastUpdatedBy
                    }) : ''
                },
                children: 'Last updated{atDate}{byUser}'
            }),
             false && /*#__PURE__*/ 0
        ]
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/EditMetaRow/styles.module.css
// extracted by css-extract-rspack-plugin
/* export default */ const EditMetaRow_styles_module = ({"lastUpdated":"lastUpdated_x0d_","noPrint":"noPrint_TLEH"});
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/EditMetaRow/index.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 




function EditMetaRow({ className, editUrl, lastUpdatedAt, lastUpdatedBy }) {
    return /*#__PURE__*/ (0,jsx_runtime.jsxs)("div", {
        className: (0,clsx/* ["default"] */.A)('row', className),
        children: [
            /*#__PURE__*/ (0,jsx_runtime.jsx)("div", {
                className: (0,clsx/* ["default"] */.A)('col', EditMetaRow_styles_module.noPrint),
                children: editUrl && /*#__PURE__*/ (0,jsx_runtime.jsx)(EditThisPage, {
                    editUrl: editUrl
                })
            }),
            /*#__PURE__*/ (0,jsx_runtime.jsx)("div", {
                className: (0,clsx/* ["default"] */.A)('col', EditMetaRow_styles_module.lastUpdated),
                children: (lastUpdatedAt || lastUpdatedBy) && /*#__PURE__*/ (0,jsx_runtime.jsx)(LastUpdated, {
                    lastUpdatedAt: lastUpdatedAt,
                    lastUpdatedBy: lastUpdatedBy
                })
            })
        ]
    });
}


},
7188(__unused_rspack_module, __webpack_exports__, __webpack_require__) {

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  A: () => (/* binding */ MDXContent)
});

// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/index.js
var react = __webpack_require__(2086);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+core@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@swc+core@1._c9fc87af6c6a9eba42ca6d26121f471f/node_modules/@docusaurus/core/lib/client/exports/Head.js
var Head = __webpack_require__(8999);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/CodeBlock/index.js + 27 modules
var CodeBlock = __webpack_require__(1152);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/CodeInline/index.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 
// Simple component used to render inline code blocks
// its purpose is to be swizzled and customized
// MDX 1 used to have a inlineCode comp, see https://mdxjs.com/migrating/v2/
function CodeInline(props) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)("code", {
        ...props
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/MDXComponents/Code.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 


function shouldBeInline(props) {
    return(// empty code blocks have no props.children,
    // see https://github.com/facebook/docusaurus/pull/9704
    typeof props.children !== 'undefined' && react.Children.toArray(props.children).every((el)=>typeof el === 'string' && !el.includes('\n')));
}
function MDXCode(props) {
    return shouldBeInline(props) ? /*#__PURE__*/ (0,jsx_runtime.jsx)(CodeInline, {
        ...props
    }) : /*#__PURE__*/ (0,jsx_runtime.jsx)(CodeBlock/* ["default"] */.A, {
        ...props
    });
}

// EXTERNAL MODULE: ./node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
var clsx = __webpack_require__(3526);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+core@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@swc+core@1._c9fc87af6c6a9eba42ca6d26121f471f/node_modules/@docusaurus/core/lib/client/exports/Link.js
var Link = __webpack_require__(1041);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-common@3.10.0_@docusaurus+plugin-content-docs@3.10.0_@docusaurus+fast_2c7af3544eee2ad1196d844307749877/node_modules/@docusaurus/theme-common/lib/utils/anchorUtils.js + 1 modules
var anchorUtils = __webpack_require__(7371);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/MDXComponents/A/index.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 



function MDXA(props) {
    // MDX Footnotes have ids such as <a id="user-content-fn-1-953011" ...>
    const anchorTargetClassName = (0,anchorUtils/* .useAnchorTargetClassName */.v)(props.id);
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(Link/* ["default"] */.A, {
        ...props,
        className: (0,clsx/* ["default"] */.A)(anchorTargetClassName, props.className)
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/MDXComponents/Pre.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 
function MDXPre(props) {
    // With MDX 2, this element is only used for fenced code blocks
    // It always receives a MDXComponents/Code as children
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(jsx_runtime.Fragment, {
        children: props.children
    });
}

// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+core@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@swc+core@1._c9fc87af6c6a9eba42ca6d26121f471f/node_modules/@docusaurus/core/lib/client/exports/useBrokenLinks.js + 1 modules
var useBrokenLinks = __webpack_require__(1975);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+core@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@swc+core@1._c9fc87af6c6a9eba42ca6d26121f471f/node_modules/@docusaurus/core/lib/client/exports/useIsBrowser.js
var useIsBrowser = __webpack_require__(5408);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-common@3.10.0_@docusaurus+plugin-content-docs@3.10.0_@docusaurus+fast_2c7af3544eee2ad1196d844307749877/node_modules/@docusaurus/theme-common/lib/components/Collapsible/index.js
var Collapsible = __webpack_require__(742);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-common@3.10.0_@docusaurus+plugin-content-docs@3.10.0_@docusaurus+fast_2c7af3544eee2ad1196d844307749877/node_modules/@docusaurus/theme-common/lib/components/Details/styles.module.css
// extracted by css-extract-rspack-plugin
/* export default */ const styles_module = ({"details":"details_Jde1","isBrowser":"isBrowser_E2TG","collapsibleContent":"collapsibleContent_H3l0"});
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-common@3.10.0_@docusaurus+plugin-content-docs@3.10.0_@docusaurus+fast_2c7af3544eee2ad1196d844307749877/node_modules/@docusaurus/theme-common/lib/components/Details/index.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 





function isInSummary(node) {
    if (!node) {
        return false;
    }
    return node.tagName === 'SUMMARY' || isInSummary(node.parentElement);
}
function hasParent(node, parent) {
    if (!node) {
        return false;
    }
    return node === parent || hasParent(node.parentElement, parent);
}
/**
 * A mostly un-styled `<details>` element with smooth collapsing. Provides some
 * very lightweight styles, but you should bring your UI.
 */ function Details({ summary, children, ...props }) {
    (0,useBrokenLinks/* ["default"] */.A)().collectAnchor(props.id);
    const isBrowser = (0,useIsBrowser/* ["default"] */.A)();
    const detailsRef = (0,react.useRef)(null);
    const { collapsed, setCollapsed } = (0,Collapsible/* .useCollapsible */.u)({
        initialState: !props.open
    });
    // Use a separate state for the actual details prop, because it must be set
    // only after animation completes, otherwise close animations won't work
    const [open, setOpen] = (0,react.useState)(props.open);
    const summaryElement = /*#__PURE__*/ react.isValidElement(summary) ? summary : /*#__PURE__*/ (0,jsx_runtime.jsx)("summary", {
        children: summary ?? 'Details'
    });
    return(// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    /*#__PURE__*/ (0,jsx_runtime.jsxs)("details", {
        ...props,
        ref: detailsRef,
        open: open,
        "data-collapsed": collapsed,
        className: (0,clsx/* ["default"] */.A)(styles_module.details, isBrowser && styles_module.isBrowser, props.className),
        onMouseDown: (e)=>{
            const target = e.target;
            // Prevent a double-click to highlight summary text
            if (isInSummary(target) && e.detail > 1) {
                e.preventDefault();
            }
        },
        onClick: (e)=>{
            e.stopPropagation(); // For isolation of multiple nested details/summary
            const target = e.target;
            const shouldToggle = isInSummary(target) && hasParent(target, detailsRef.current);
            if (!shouldToggle) {
                return;
            }
            e.preventDefault();
            if (collapsed) {
                setCollapsed(false);
                setOpen(true);
            } else {
                setCollapsed(true);
            // Don't do this, it breaks close animation!
            // setOpen(false);
            }
        },
        children: [
            summaryElement,
            /*#__PURE__*/ (0,jsx_runtime.jsx)(Collapsible/* .Collapsible */.N, {
                lazy: false,
                collapsed: collapsed,
                onCollapseTransitionEnd: (newCollapsed)=>{
                    setCollapsed(newCollapsed);
                    setOpen(!newCollapsed);
                },
                children: /*#__PURE__*/ (0,jsx_runtime.jsx)("div", {
                    className: styles_module.collapsibleContent,
                    children: children
                })
            })
        ]
    }));
} //# sourceMappingURL=index.js.map

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Details/styles.module.css
// extracted by css-extract-rspack-plugin
/* export default */ const Details_styles_module = ({"details":"details_reBJ"});
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Details/index.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 



// Should we have a custom details/summary comp in Infima instead of reusing
// alert classes?
const InfimaClasses = 'alert alert--info';
function Details_Details({ ...props }) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(Details, {
        ...props,
        className: (0,clsx/* ["default"] */.A)(InfimaClasses, Details_styles_module.details, props.className)
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/MDXComponents/Details.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 

function MDXDetails(props) {
    const items = react.Children.toArray(props.children);
    // Split summary item from the rest to pass it as a separate prop to the
    // Details theme component
    const summary = items.find((item)=>/*#__PURE__*/ react.isValidElement(item) && item.type === 'summary');
    const children = /*#__PURE__*/ (0,jsx_runtime.jsx)(jsx_runtime.Fragment, {
        children: items.filter((item)=>item !== summary)
    });
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(Details_Details, {
        ...props,
        summary: summary,
        children: children
    });
}

// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Heading/index.js
var Heading = __webpack_require__(2285);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/MDXComponents/Heading.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 

function MDXHeading(props) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(Heading/* ["default"] */.A, {
        ...props
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/MDXComponents/Ul/styles.module.css
// extracted by css-extract-rspack-plugin
/* export default */ const Ul_styles_module = ({"containsTaskList":"containsTaskList_kv89"});
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/MDXComponents/Ul/index.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 


function transformUlClassName(className) {
    // Fix https://github.com/facebook/docusaurus/issues/9098
    if (typeof className === 'undefined') {
        return undefined;
    }
    return (0,clsx/* ["default"] */.A)(className, // This class is set globally by GitHub/MDX. We keep the global class, and
    // add another class to get a task list without the default ul styling
    // See https://github.com/syntax-tree/mdast-util-to-hast/issues/28
    className?.includes('contains-task-list') && Ul_styles_module.containsTaskList);
}
function MDXUl(props) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)("ul", {
        ...props,
        className: transformUlClassName(props.className)
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/MDXComponents/Li.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 



function MDXLi(props) {
    // MDX Footnotes have ids such as <li id="user-content-fn-1-953011">
    (0,useBrokenLinks/* ["default"] */.A)().collectAnchor(props.id);
    const anchorTargetClassName = (0,anchorUtils/* .useAnchorTargetClassName */.v)(props.id);
    return /*#__PURE__*/ (0,jsx_runtime.jsx)("li", {
        className: (0,clsx/* ["default"] */.A)(anchorTargetClassName, props.className),
        ...props
    });
}

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/MDXComponents/Img/styles.module.css
// extracted by css-extract-rspack-plugin
/* export default */ const Img_styles_module = ({"img":"img_WML7"});
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/MDXComponents/Img/index.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 


function transformImgClassName(className) {
    return (0,clsx/* ["default"] */.A)(className, Img_styles_module.img);
}
function MDXImg(props) {
    return(// eslint-disable-next-line jsx-a11y/alt-text
    /*#__PURE__*/ (0,jsx_runtime.jsx)("img", {
        decoding: "async",
        loading: "lazy",
        ...props,
        className: transformImgClassName(props.className)
    }));
}

// EXTERNAL MODULE: ./src/theme/Admonition.tsx
var Admonition = __webpack_require__(6871);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+core@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@swc+core@1._c9fc87af6c6a9eba42ca6d26121f471f/node_modules/@docusaurus/core/lib/client/exports/Noop.js
var Noop = __webpack_require__(573);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/MDXComponents/index.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 











const MDXComponents = {
    Head: Head/* ["default"] */.A,
    details: MDXDetails,
    Details: MDXDetails,
    code: MDXCode,
    a: MDXA,
    pre: MDXPre,
    ul: MDXUl,
    li: MDXLi,
    img: MDXImg,
    h1: (props)=>/*#__PURE__*/ (0,jsx_runtime.jsx)(MDXHeading, {
            as: "h1",
            ...props
        }),
    h2: (props)=>/*#__PURE__*/ (0,jsx_runtime.jsx)(MDXHeading, {
            as: "h2",
            ...props
        }),
    h3: (props)=>/*#__PURE__*/ (0,jsx_runtime.jsx)(MDXHeading, {
            as: "h3",
            ...props
        }),
    h4: (props)=>/*#__PURE__*/ (0,jsx_runtime.jsx)(MDXHeading, {
            as: "h4",
            ...props
        }),
    h5: (props)=>/*#__PURE__*/ (0,jsx_runtime.jsx)(MDXHeading, {
            as: "h5",
            ...props
        }),
    h6: (props)=>/*#__PURE__*/ (0,jsx_runtime.jsx)(MDXHeading, {
            as: "h6",
            ...props
        }),
    admonition: Admonition/* ["default"] */.A,
    mermaid: Noop/* ["default"] */.A
};
/* export default */ const theme_MDXComponents = (MDXComponents);

;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/MDXContent/index.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 


function MDXContent({ children }) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(lib/* .MDXProvider */.x, {
        components: theme_MDXComponents,
        children: children
    });
}


},
658(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.d(__webpack_exports__, {
  i: () => (useDateTimeFormat)
});
/* import */ var _docusaurus_useDocusaurusContext__rspack_import_0 = __webpack_require__(1645);
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 
function useCalendar() {
    const { i18n: { currentLocale, localeConfigs } } = (0,_docusaurus_useDocusaurusContext__rspack_import_0/* ["default"] */.A)();
    return localeConfigs[currentLocale].calendar;
}
function useDateTimeFormat(options = {}) {
    const { i18n: { currentLocale } } = (0,_docusaurus_useDocusaurusContext__rspack_import_0/* ["default"] */.A)();
    const calendar = useCalendar();
    return new Intl.DateTimeFormat(currentLocale, {
        calendar,
        ...options
    });
} //# sourceMappingURL=IntlUtils.js.map


},

}]);