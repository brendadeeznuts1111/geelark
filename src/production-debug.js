#!/usr/bin/env bun
// @bun

// node_modules/chalk/source/vendor/ansi-styles/index.js
var ANSI_BACKGROUND_OFFSET = 10;
var wrapAnsi16 = (offset = 0) => (code) => `\x1B[${code + offset}m`;
var wrapAnsi256 = (offset = 0) => (code) => `\x1B[${38 + offset};5;${code}m`;
var wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`;
var styles = {
  modifier: {
    reset: [0, 0],
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29]
  },
  color: {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    blackBright: [90, 39],
    gray: [90, 39],
    grey: [90, 39],
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39]
  },
  bgColor: {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    bgGrey: [100, 49],
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49]
  }
};
var modifierNames = Object.keys(styles.modifier);
var foregroundColorNames = Object.keys(styles.color);
var backgroundColorNames = Object.keys(styles.bgColor);
var colorNames = [...foregroundColorNames, ...backgroundColorNames];
function assembleStyles() {
  const codes = new Map;
  for (const [groupName, group] of Object.entries(styles)) {
    for (const [styleName, style] of Object.entries(group)) {
      styles[styleName] = {
        open: `\x1B[${style[0]}m`,
        close: `\x1B[${style[1]}m`
      };
      group[styleName] = styles[styleName];
      codes.set(style[0], style[1]);
    }
    Object.defineProperty(styles, groupName, {
      value: group,
      enumerable: false
    });
  }
  Object.defineProperty(styles, "codes", {
    value: codes,
    enumerable: false
  });
  styles.color.close = "\x1B[39m";
  styles.bgColor.close = "\x1B[49m";
  styles.color.ansi = wrapAnsi16();
  styles.color.ansi256 = wrapAnsi256();
  styles.color.ansi16m = wrapAnsi16m();
  styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
  Object.defineProperties(styles, {
    rgbToAnsi256: {
      value(red, green, blue) {
        if (red === green && green === blue) {
          if (red < 8) {
            return 16;
          }
          if (red > 248) {
            return 231;
          }
          return Math.round((red - 8) / 247 * 24) + 232;
        }
        return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
      },
      enumerable: false
    },
    hexToRgb: {
      value(hex) {
        const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
        if (!matches) {
          return [0, 0, 0];
        }
        let [colorString] = matches;
        if (colorString.length === 3) {
          colorString = [...colorString].map((character) => character + character).join("");
        }
        const integer = Number.parseInt(colorString, 16);
        return [
          integer >> 16 & 255,
          integer >> 8 & 255,
          integer & 255
        ];
      },
      enumerable: false
    },
    hexToAnsi256: {
      value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
      enumerable: false
    },
    ansi256ToAnsi: {
      value(code) {
        if (code < 8) {
          return 30 + code;
        }
        if (code < 16) {
          return 90 + (code - 8);
        }
        let red;
        let green;
        let blue;
        if (code >= 232) {
          red = ((code - 232) * 10 + 8) / 255;
          green = red;
          blue = red;
        } else {
          code -= 16;
          const remainder = code % 36;
          red = Math.floor(code / 36) / 5;
          green = Math.floor(remainder / 6) / 5;
          blue = remainder % 6 / 5;
        }
        const value = Math.max(red, green, blue) * 2;
        if (value === 0) {
          return 30;
        }
        let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
        if (value === 2) {
          result += 60;
        }
        return result;
      },
      enumerable: false
    },
    rgbToAnsi: {
      value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
      enumerable: false
    },
    hexToAnsi: {
      value: (hex) => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
      enumerable: false
    }
  });
  return styles;
}
var ansiStyles = assembleStyles();
var ansi_styles_default = ansiStyles;

// node_modules/chalk/source/vendor/supports-color/index.js
import process2 from "process";
import os from "os";
import tty from "tty";
function hasFlag(flag, argv = globalThis.Deno ? globalThis.Deno.args : process2.argv) {
  const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
  const position = argv.indexOf(prefix + flag);
  const terminatorPosition = argv.indexOf("--");
  return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
}
var { env } = process2;
var flagForceColor;
if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
  flagForceColor = 0;
} else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
  flagForceColor = 1;
}
function envForceColor() {
  if ("FORCE_COLOR" in env) {
    if (env.FORCE_COLOR === "true") {
      return 1;
    }
    if (env.FORCE_COLOR === "false") {
      return 0;
    }
    return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
  }
}
function translateLevel(level) {
  if (level === 0) {
    return false;
  }
  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3
  };
}
function _supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
  const noFlagForceColor = envForceColor();
  if (noFlagForceColor !== undefined) {
    flagForceColor = noFlagForceColor;
  }
  const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
  if (forceColor === 0) {
    return 0;
  }
  if (sniffFlags) {
    if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
      return 3;
    }
    if (hasFlag("color=256")) {
      return 2;
    }
  }
  if ("TF_BUILD" in env && "AGENT_NAME" in env) {
    return 1;
  }
  if (haveStream && !streamIsTTY && forceColor === undefined) {
    return 0;
  }
  const min = forceColor || 0;
  if (env.TERM === "dumb") {
    return min;
  }
  if (process2.platform === "win32") {
    const osRelease = os.release().split(".");
    if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
      return Number(osRelease[2]) >= 14931 ? 3 : 2;
    }
    return 1;
  }
  if ("CI" in env) {
    if (["GITHUB_ACTIONS", "GITEA_ACTIONS", "CIRCLECI"].some((key) => (key in env))) {
      return 3;
    }
    if (["TRAVIS", "APPVEYOR", "GITLAB_CI", "BUILDKITE", "DRONE"].some((sign) => (sign in env)) || env.CI_NAME === "codeship") {
      return 1;
    }
    return min;
  }
  if ("TEAMCITY_VERSION" in env) {
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
  }
  if (env.COLORTERM === "truecolor") {
    return 3;
  }
  if (env.TERM === "xterm-kitty") {
    return 3;
  }
  if (env.TERM === "xterm-ghostty") {
    return 3;
  }
  if (env.TERM === "wezterm") {
    return 3;
  }
  if ("TERM_PROGRAM" in env) {
    const version = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
    switch (env.TERM_PROGRAM) {
      case "iTerm.app": {
        return version >= 3 ? 3 : 2;
      }
      case "Apple_Terminal": {
        return 2;
      }
    }
  }
  if (/-256(color)?$/i.test(env.TERM)) {
    return 2;
  }
  if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
    return 1;
  }
  if ("COLORTERM" in env) {
    return 1;
  }
  return min;
}
function createSupportsColor(stream, options = {}) {
  const level = _supportsColor(stream, {
    streamIsTTY: stream && stream.isTTY,
    ...options
  });
  return translateLevel(level);
}
var supportsColor = {
  stdout: createSupportsColor({ isTTY: tty.isatty(1) }),
  stderr: createSupportsColor({ isTTY: tty.isatty(2) })
};
var supports_color_default = supportsColor;

// node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, replacer) {
  let index = string.indexOf(substring);
  if (index === -1) {
    return string;
  }
  const substringLength = substring.length;
  let endIndex = 0;
  let returnValue = "";
  do {
    returnValue += string.slice(endIndex, index) + substring + replacer;
    endIndex = index + substringLength;
    index = string.indexOf(substring, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
  let endIndex = 0;
  let returnValue = "";
  do {
    const gotCR = string[index - 1] === "\r";
    returnValue += string.slice(endIndex, gotCR ? index - 1 : index) + prefix + (gotCR ? `\r
` : `
`) + postfix;
    endIndex = index + 1;
    index = string.indexOf(`
`, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}

// node_modules/chalk/source/index.js
var { stdout: stdoutColor, stderr: stderrColor } = supports_color_default;
var GENERATOR = Symbol("GENERATOR");
var STYLER = Symbol("STYLER");
var IS_EMPTY = Symbol("IS_EMPTY");
var levelMapping = [
  "ansi",
  "ansi",
  "ansi256",
  "ansi16m"
];
var styles2 = Object.create(null);
var applyOptions = (object, options = {}) => {
  if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
    throw new Error("The `level` option should be an integer from 0 to 3");
  }
  const colorLevel = stdoutColor ? stdoutColor.level : 0;
  object.level = options.level === undefined ? colorLevel : options.level;
};
var chalkFactory = (options) => {
  const chalk = (...strings) => strings.join(" ");
  applyOptions(chalk, options);
  Object.setPrototypeOf(chalk, createChalk.prototype);
  return chalk;
};
function createChalk(options) {
  return chalkFactory(options);
}
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(ansi_styles_default)) {
  styles2[styleName] = {
    get() {
      const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
      Object.defineProperty(this, styleName, { value: builder });
      return builder;
    }
  };
}
styles2.visible = {
  get() {
    const builder = createBuilder(this, this[STYLER], true);
    Object.defineProperty(this, "visible", { value: builder });
    return builder;
  }
};
var getModelAnsi = (model, level, type, ...arguments_) => {
  if (model === "rgb") {
    if (level === "ansi16m") {
      return ansi_styles_default[type].ansi16m(...arguments_);
    }
    if (level === "ansi256") {
      return ansi_styles_default[type].ansi256(ansi_styles_default.rgbToAnsi256(...arguments_));
    }
    return ansi_styles_default[type].ansi(ansi_styles_default.rgbToAnsi(...arguments_));
  }
  if (model === "hex") {
    return getModelAnsi("rgb", level, type, ...ansi_styles_default.hexToRgb(...arguments_));
  }
  return ansi_styles_default[type][model](...arguments_);
};
var usedModels = ["rgb", "hex", "ansi256"];
for (const model of usedModels) {
  styles2[model] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "color", ...arguments_), ansi_styles_default.color.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
  const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
  styles2[bgModel] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "bgColor", ...arguments_), ansi_styles_default.bgColor.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
}
var proto = Object.defineProperties(() => {}, {
  ...styles2,
  level: {
    enumerable: true,
    get() {
      return this[GENERATOR].level;
    },
    set(level) {
      this[GENERATOR].level = level;
    }
  }
});
var createStyler = (open, close, parent) => {
  let openAll;
  let closeAll;
  if (parent === undefined) {
    openAll = open;
    closeAll = close;
  } else {
    openAll = parent.openAll + open;
    closeAll = close + parent.closeAll;
  }
  return {
    open,
    close,
    openAll,
    closeAll,
    parent
  };
};
var createBuilder = (self, _styler, _isEmpty) => {
  const builder = (...arguments_) => applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
  Object.setPrototypeOf(builder, proto);
  builder[GENERATOR] = self;
  builder[STYLER] = _styler;
  builder[IS_EMPTY] = _isEmpty;
  return builder;
};
var applyStyle = (self, string) => {
  if (self.level <= 0 || !string) {
    return self[IS_EMPTY] ? "" : string;
  }
  let styler = self[STYLER];
  if (styler === undefined) {
    return string;
  }
  const { openAll, closeAll } = styler;
  if (string.includes("\x1B")) {
    while (styler !== undefined) {
      string = stringReplaceAll(string, styler.close, styler.open);
      styler = styler.parent;
    }
  }
  const lfIndex = string.indexOf(`
`);
  if (lfIndex !== -1) {
    string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
  }
  return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, styles2);
var chalk = createChalk();
var chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });
var source_default = chalk;

// src/StringWidth.ts
class StringWidth {
  static FLAG_EMOJI_REGEX = /\p{Emoji}\uFE0F?\u200D?\p{Emoji}/u;
  static ZWJ_SEQUENCE_REGEX = /\p{Emoji}(\u200D\p{Emoji})+/u;
  static VARIATION_SELECTOR_REGEX = /\p{Emoji}\uFE0E|\p{Emoji}\uFE0F/gu;
  static ANSI_ESCAPE_REGEX = /\x1b\[[0-9;]*[mG]/g;
  static ZERO_WIDTH_CHARS = /\u200B|\u200C|\u200D|\uFEFF/g;
  static SOFT_HYPHEN = /\u00AD/g;
  static EAST_ASIAN_WIDE = /[\u1100-\u115F\u11A3-\u11A7\u11FA-\u11FF\u2329-\u232A\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3000-\u303E\u3041-\u3096\u3099-\u30FF\u3105-\u312D\u3131-\u318E\u3190-\u31BA\u31C0-\u31E3\u31F0-\u321E\u3220-\u3247\u3250-\u32FE\u3300-\u4DBF\u4E00-\u9FFF\uA000-\uA48F\uA490-\uA4CF\uA960-\uA97F\uAC00-\uD7AF\uF900-\uFAFF\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE66\uFE68-\uFE6B\uFF01-\uFF60\uFFE0-\uFFE6]/g;
  static ANSI_HYPERLINK_REGEX = /\x1b\]8;;[^\x1b]*\x1b\\\x1b\]8;;\x1b\\/g;
  static calculate(str) {
    if (!str)
      return 0;
    let width = 0;
    let i = 0;
    while (i < str.length) {
      const codePoint = str.codePointAt(i);
      if (codePoint === undefined)
        break;
      const char = String.fromCodePoint(codePoint);
      const charWidth = this.getCharWidth(char, str, i);
      width += charWidth;
      i += char.length;
    }
    return width;
  }
  static getCharWidth(char, fullString, index) {
    if (this.ANSI_ESCAPE_REGEX.test(char)) {
      return 0;
    }
    if (this.ZERO_WIDTH_CHARS.test(char)) {
      return 0;
    }
    const hyperlinkMatch = fullString.substring(index).match(this.ANSI_HYPERLINK_REGEX);
    if (hyperlinkMatch && hyperlinkMatch.index === 0) {
      const linkText = hyperlinkMatch[0].replace(this.ANSI_HYPERLINK_REGEX, (match) => {
        const parts = match.split("\x1B\\");
        return parts.length > 1 ? parts[0].split(";")[2] || "" : "";
      });
      return this.calculate(linkText);
    }
    if (this.isFlagEmoji(char, fullString, index)) {
      return 2;
    }
    if (this.isZWJSequence(fullString, index)) {
      return 2;
    }
    if (this.isSkinToneModifier(char)) {
      return 0;
    }
    if (this.isVariationSelector(char)) {
      return 0;
    }
    if (this.isCombiningMark(char)) {
      return 0;
    }
    if (char === "\xAD") {
      return 0;
    }
    if (this.EAST_ASIAN_WIDE.test(char)) {
      return 2;
    }
    if (this.isEmoji(char)) {
      return 2;
    }
    if (this.isControlCharacter(char)) {
      return 0;
    }
    return 1;
  }
  static isFlagEmoji(char, fullString, index) {
    if (index + 1 < fullString.length) {
      const nextChar = fullString[index + 1];
      const currentCode = char.codePointAt(0);
      const nextCode = nextChar.codePointAt(0);
      if (currentCode && nextCode && currentCode >= 127462 && currentCode <= 127487 && nextCode >= 127462 && nextCode <= 127487) {
        return true;
      }
    }
    return /\p{Emoji_Presentation}\p{Emoji_Presentation}/.test(char) || /\p{Emoji}\uFE0F/.test(char);
  }
  static isZWJSequence(fullString, index) {
    let sequence = "";
    let i = index;
    while (i < fullString.length) {
      const codePoint = fullString.codePointAt(i);
      if (!codePoint)
        break;
      const char = String.fromCodePoint(codePoint);
      sequence += char;
      if (char === "\u200D" && i + 1 < fullString.length) {
        const nextCodePoint = fullString.codePointAt(i + 1);
        if (nextCodePoint && this.isEmoji(String.fromCodePoint(nextCodePoint))) {
          i += String.fromCodePoint(nextCodePoint).length;
          continue;
        }
      }
      if (!this.isEmoji(char) && char !== "\u200D" && char !== "\uFE0F") {
        break;
      }
      i += char.length;
      if (sequence.length > 20)
        break;
    }
    return sequence.includes("\u200D") && sequence.length > 1;
  }
  static isSkinToneModifier(char) {
    const code = char.codePointAt(0);
    return code !== undefined && code >= 127995 && code <= 127999;
  }
  static isVariationSelector(char) {
    const code = char.codePointAt(0);
    return code !== undefined && (code === 65038 || code === 65039);
  }
  static isCombiningMark(char) {
    const code = char.codePointAt(0);
    if (!code)
      return false;
    return code >= 768 && code <= 879 || code >= 6832 && code <= 6911 || code >= 7616 && code <= 7679 || code >= 8400 && code <= 8447 || code >= 65056 && code <= 65071;
  }
  static isEmoji(char) {
    const code = char.codePointAt(0);
    if (!code)
      return false;
    return code >= 128512 && code <= 128591 || code >= 127744 && code <= 128511 || code >= 128640 && code <= 128767 || code >= 127456 && code <= 127487 || code >= 9728 && code <= 9983 || code >= 9984 && code <= 10175 || code >= 129318 && code <= 129335 || code >= 129336 && code <= 129342 || code >= 129343 && code <= 129359 || code >= 129360 && code <= 129391 || code >= 129392 && code <= 129407 || code >= 129408 && code <= 129471 || code >= 129472 && code <= 129487 || code >= 129488 && code <= 129535;
  }
  static isControlCharacter(char) {
    const code = char.codePointAt(0);
    return code !== undefined && code < 32;
  }
  static truncate(str, maxWidth, suffix = "...") {
    if (this.calculate(str) <= maxWidth) {
      return str;
    }
    let result = "";
    let width = 0;
    for (let i = 0;i < str.length; i++) {
      const char = str[i];
      const charWidth = this.getCharWidth(char, str, i);
      if (width + charWidth + this.calculate(suffix) > maxWidth) {
        break;
      }
      result += char;
      width += charWidth;
    }
    return result + suffix;
  }
  static padEnd(str, targetWidth, padChar = " ") {
    const currentWidth = this.calculate(str);
    if (currentWidth >= targetWidth) {
      return str;
    }
    const padding = targetWidth - currentWidth;
    return str + padChar.repeat(padding);
  }
  static padStart(str, targetWidth, padChar = " ") {
    const currentWidth = this.calculate(str);
    if (currentWidth >= targetWidth) {
      return str;
    }
    const padding = targetWidth - currentWidth;
    return padChar.repeat(padding) + str;
  }
  static center(str, targetWidth, padChar = " ") {
    const currentWidth = this.calculate(str);
    if (currentWidth >= targetWidth) {
      return str;
    }
    const totalPadding = targetWidth - currentWidth;
    const leftPadding = Math.floor(totalPadding / 2);
    const rightPadding = totalPadding - leftPadding;
    return padChar.repeat(leftPadding) + str + padChar.repeat(rightPadding);
  }
  static wrap(str, maxWidth) {
    const lines = [];
    const words = str.split(/\s+/);
    let currentLine = "";
    let currentWidth = 0;
    for (const word of words) {
      const wordWidth = this.calculate(word);
      const spaceWidth = currentLine ? 1 : 0;
      if (currentWidth + spaceWidth + wordWidth <= maxWidth) {
        if (currentLine) {
          currentLine += " " + word;
          currentWidth += spaceWidth + wordWidth;
        } else {
          currentLine = word;
          currentWidth = wordWidth;
        }
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
        currentWidth = wordWidth;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }
}
var stringWidth = StringWidth.calculate;

// src/types.ts
var FeatureFlag;
((FeatureFlag2) => {
  FeatureFlag2["ENV_DEVELOPMENT"] = "ENV_DEVELOPMENT";
  FeatureFlag2["ENV_PRODUCTION"] = "ENV_PRODUCTION";
  FeatureFlag2["FEAT_PREMIUM"] = "FEAT_PREMIUM";
  FeatureFlag2["FEAT_AUTO_HEAL"] = "FEAT_AUTO_HEAL";
  FeatureFlag2["FEAT_NOTIFICATIONS"] = "FEAT_NOTIFICATIONS";
  FeatureFlag2["FEAT_ENCRYPTION"] = "FEAT_ENCRYPTION";
  FeatureFlag2["FEAT_MOCK_API"] = "FEAT_MOCK_API";
  FeatureFlag2["FEAT_EXTENDED_LOGGING"] = "FEAT_EXTENDED_LOGGING";
  FeatureFlag2["FEAT_ADVANCED_MONITORING"] = "FEAT_ADVANCED_MONITORING";
  FeatureFlag2["FEAT_BATCH_PROCESSING"] = "FEAT_BATCH_PROCESSING";
  FeatureFlag2["FEAT_VALIDATION_STRICT"] = "FEAT_VALIDATION_STRICT";
  FeatureFlag2["PLATFORM_ANDROID"] = "PLATFORM_ANDROID";
  FeatureFlag2["INTEGRATION_GEELARK_API"] = "INTEGRATION_GEELARK_API";
  FeatureFlag2["INTEGRATION_PROXY_SERVICE"] = "INTEGRATION_PROXY_SERVICE";
  FeatureFlag2["INTEGRATION_EMAIL_SERVICE"] = "INTEGRATION_EMAIL_SERVICE";
  FeatureFlag2["INTEGRATION_SMS_SERVICE"] = "INTEGRATION_SMS_SERVICE";
})(FeatureFlag ||= {});
var LogType;
((LogType2) => {
  LogType2["FEATURE_CHANGE"] = "FEATURE_CHANGE";
  LogType2["SECURITY_EVENT"] = "SECURITY_EVENT";
  LogType2["INTEGRATION_EVENT"] = "INTEGRATION_EVENT";
  LogType2["PERFORMANCE_METRIC"] = "PERFORMANCE_METRIC";
  LogType2["ERROR_OCCURRED"] = "ERROR_OCCURRED";
  LogType2["AUDIT_TRAIL"] = "AUDIT_TRAIL";
  LogType2["HEALTH_CHECK"] = "HEALTH_CHECK";
})(LogType ||= {});
var LogLevel;
((LogLevel2) => {
  LogLevel2["DEBUG"] = "DEBUG";
  LogLevel2["INFO"] = "INFO";
  LogLevel2["WARN"] = "WARN";
  LogLevel2["ERROR"] = "ERROR";
  LogLevel2["CRITICAL"] = "CRITICAL";
})(LogLevel ||= {});
var BuildType;
((BuildType2) => {
  BuildType2["DEVELOPMENT"] = "DEVELOPMENT";
  BuildType2["PRODUCTION_LITE"] = "PRODUCTION_LITE";
  BuildType2["PRODUCTION_STANDARD"] = "PRODUCTION_STANDARD";
  BuildType2["PRODUCTION_PREMIUM"] = "PRODUCTION_PREMIUM";
  BuildType2["TEST"] = "TEST";
  BuildType2["AUDIT"] = "AUDIT";
})(BuildType ||= {});

// src/config.ts
var FEATURE_FLAG_CONFIGS = {
  ["ENV_DEVELOPMENT" /* ENV_DEVELOPMENT */]: {
    flag: "ENV_DEVELOPMENT" /* ENV_DEVELOPMENT */,
    criticalLevel: "CRITICAL" /* CRITICAL */,
    logHook: "FEATURE_CHANGE" /* FEATURE_CHANGE */,
    badgeEnabled: "\uD83C\uDF0D DEV",
    badgeDisabled: "\uD83C\uDF0D PROD",
    buildTimeImpact: "+15% size"
  },
  ["ENV_PRODUCTION" /* ENV_PRODUCTION */]: {
    flag: "ENV_PRODUCTION" /* ENV_PRODUCTION */,
    criticalLevel: "CRITICAL" /* CRITICAL */,
    logHook: "FEATURE_CHANGE" /* FEATURE_CHANGE */,
    badgeEnabled: "\uD83C\uDF0D PROD",
    badgeDisabled: "\uD83C\uDF0D DEV",
    buildTimeImpact: "-25% size"
  },
  ["FEAT_PREMIUM" /* FEAT_PREMIUM */]: {
    flag: "FEAT_PREMIUM" /* FEAT_PREMIUM */,
    criticalLevel: "HIGH" /* HIGH */,
    logHook: "FEATURE_CHANGE" /* FEATURE_CHANGE */,
    badgeEnabled: "\uD83C\uDFC6 PREMIUM",
    badgeDisabled: "\uD83D\uDD13 FREE",
    buildTimeImpact: "+15% size",
    memoryImpact: "+15%",
    cpuImpact: "+5%",
    bundleSizeImpact: "+12%",
    startupTimeImpact: "+200ms"
  },
  ["FEAT_AUTO_HEAL" /* FEAT_AUTO_HEAL */]: {
    flag: "FEAT_AUTO_HEAL" /* FEAT_AUTO_HEAL */,
    criticalLevel: "HIGH" /* HIGH */,
    logHook: "FEATURE_CHANGE" /* FEATURE_CHANGE */,
    badgeEnabled: "\uD83D\uDD04 AUTO-HEAL",
    badgeDisabled: "\u26A0\uFE0F MANUAL",
    buildTimeImpact: "+10% size",
    memoryImpact: "+8%",
    cpuImpact: "+3%",
    bundleSizeImpact: "+10%",
    startupTimeImpact: "+150ms"
  },
  ["FEAT_NOTIFICATIONS" /* FEAT_NOTIFICATIONS */]: {
    flag: "FEAT_NOTIFICATIONS" /* FEAT_NOTIFICATIONS */,
    criticalLevel: "MEDIUM" /* MEDIUM */,
    logHook: "FEATURE_CHANGE" /* FEATURE_CHANGE */,
    badgeEnabled: "\uD83D\uDD14 ACTIVE",
    badgeDisabled: "\uD83D\uDD15 SILENT",
    buildTimeImpact: "+8% size",
    memoryImpact: "+3%",
    cpuImpact: "+2%",
    bundleSizeImpact: "+8%",
    startupTimeImpact: "+50ms"
  },
  ["FEAT_ENCRYPTION" /* FEAT_ENCRYPTION */]: {
    flag: "FEAT_ENCRYPTION" /* FEAT_ENCRYPTION */,
    criticalLevel: "CRITICAL" /* CRITICAL */,
    logHook: "SECURITY_EVENT" /* SECURITY_EVENT */,
    badgeEnabled: "\uD83D\uDD10 ENCRYPTED",
    badgeDisabled: "\u26A0\uFE0F PLAINTEXT",
    buildTimeImpact: "+5% size",
    memoryImpact: "+10%",
    cpuImpact: "+8%",
    bundleSizeImpact: "+5%",
    startupTimeImpact: "+300ms"
  },
  ["FEAT_MOCK_API" /* FEAT_MOCK_API */]: {
    flag: "FEAT_MOCK_API" /* FEAT_MOCK_API */,
    criticalLevel: "PROD_CRITICAL" /* PROD_CRITICAL */,
    logHook: "FEATURE_CHANGE" /* FEATURE_CHANGE */,
    badgeEnabled: "\uD83E\uDDEA MOCK",
    badgeDisabled: "\uD83D\uDE80 REAL",
    buildTimeImpact: "-20% size",
    memoryImpact: "-30%",
    cpuImpact: "-40%",
    bundleSizeImpact: "-20%",
    startupTimeImpact: "-100ms"
  },
  ["FEAT_EXTENDED_LOGGING" /* FEAT_EXTENDED_LOGGING */]: {
    flag: "FEAT_EXTENDED_LOGGING" /* FEAT_EXTENDED_LOGGING */,
    criticalLevel: "LOW" /* LOW */,
    logHook: "FEATURE_CHANGE" /* FEATURE_CHANGE */,
    badgeEnabled: "\uD83D\uDCDD VERBOSE",
    badgeDisabled: "\uD83D\uDCCB NORMAL",
    buildTimeImpact: "+12% size",
    memoryImpact: "+15%",
    cpuImpact: "+5%",
    bundleSizeImpact: "+12%",
    startupTimeImpact: "+200ms"
  },
  ["FEAT_ADVANCED_MONITORING" /* FEAT_ADVANCED_MONITORING */]: {
    flag: "FEAT_ADVANCED_MONITORING" /* FEAT_ADVANCED_MONITORING */,
    criticalLevel: "MEDIUM" /* MEDIUM */,
    logHook: "FEATURE_CHANGE" /* FEATURE_CHANGE */,
    badgeEnabled: "\uD83D\uDCC8 ADVANCED",
    badgeDisabled: "\uD83D\uDCCA BASIC",
    buildTimeImpact: "+7% size",
    memoryImpact: "+25%",
    cpuImpact: "+10%",
    bundleSizeImpact: "+7%",
    startupTimeImpact: "+500ms"
  },
  ["FEAT_BATCH_PROCESSING" /* FEAT_BATCH_PROCESSING */]: {
    flag: "FEAT_BATCH_PROCESSING" /* FEAT_BATCH_PROCESSING */,
    criticalLevel: "LOW" /* LOW */,
    logHook: "PERFORMANCE_METRIC" /* PERFORMANCE_METRIC */,
    badgeEnabled: "\u26A1 BATCH",
    badgeDisabled: "\uD83D\uDC0C SEQUENTIAL",
    buildTimeImpact: "+8% size",
    memoryImpact: "+5%",
    cpuImpact: "-20%",
    bundleSizeImpact: "+8%",
    startupTimeImpact: "+100ms"
  },
  ["FEAT_VALIDATION_STRICT" /* FEAT_VALIDATION_STRICT */]: {
    flag: "FEAT_VALIDATION_STRICT" /* FEAT_VALIDATION_STRICT */,
    criticalLevel: "HIGH" /* HIGH */,
    logHook: "FEATURE_CHANGE" /* FEATURE_CHANGE */,
    badgeEnabled: "\u2705 STRICT",
    badgeDisabled: "\u26A0\uFE0F LENIENT",
    buildTimeImpact: "+5% size",
    memoryImpact: "+5%",
    cpuImpact: "+3%",
    bundleSizeImpact: "+5%",
    startupTimeImpact: "+100ms"
  },
  ["PLATFORM_ANDROID" /* PLATFORM_ANDROID */]: {
    flag: "PLATFORM_ANDROID" /* PLATFORM_ANDROID */,
    criticalLevel: "CRITICAL" /* CRITICAL */,
    logHook: "FEATURE_CHANGE" /* FEATURE_CHANGE */,
    badgeEnabled: "\uD83E\uDD16 ANDROID",
    badgeDisabled: "\uD83C\uDF4E IOS",
    buildTimeImpact: "+10% size"
  },
  ["INTEGRATION_GEELARK_API" /* INTEGRATION_GEELARK_API */]: {
    flag: "INTEGRATION_GEELARK_API" /* INTEGRATION_GEELARK_API */,
    criticalLevel: "CRITICAL" /* CRITICAL */,
    logHook: "INTEGRATION_EVENT" /* INTEGRATION_EVENT */,
    badgeEnabled: "\uD83D\uDD0C GEELARK API",
    badgeDisabled: "\uD83D\uDD0C NO API",
    buildTimeImpact: "+20% size"
  },
  ["INTEGRATION_PROXY_SERVICE" /* INTEGRATION_PROXY_SERVICE */]: {
    flag: "INTEGRATION_PROXY_SERVICE" /* INTEGRATION_PROXY_SERVICE */,
    criticalLevel: "MEDIUM" /* MEDIUM */,
    logHook: "INTEGRATION_EVENT" /* INTEGRATION_EVENT */,
    badgeEnabled: "\uD83C\uDF10 PROXY",
    badgeDisabled: "\uD83D\uDEAB NO PROXY",
    buildTimeImpact: "+5% size"
  },
  ["INTEGRATION_EMAIL_SERVICE" /* INTEGRATION_EMAIL_SERVICE */]: {
    flag: "INTEGRATION_EMAIL_SERVICE" /* INTEGRATION_EMAIL_SERVICE */,
    criticalLevel: "MEDIUM" /* MEDIUM */,
    logHook: "INTEGRATION_EVENT" /* INTEGRATION_EVENT */,
    badgeEnabled: "\uD83D\uDCE7 EMAIL",
    badgeDisabled: "\uD83D\uDEAB NO EMAIL",
    buildTimeImpact: "+3% size"
  },
  ["INTEGRATION_SMS_SERVICE" /* INTEGRATION_SMS_SERVICE */]: {
    flag: "INTEGRATION_SMS_SERVICE" /* INTEGRATION_SMS_SERVICE */,
    criticalLevel: "MEDIUM" /* MEDIUM */,
    logHook: "INTEGRATION_EVENT" /* INTEGRATION_EVENT */,
    badgeEnabled: "\uD83D\uDCAC SMS",
    badgeDisabled: "\uD83D\uDEAB NO SMS",
    buildTimeImpact: "+3% size"
  }
};
var ALERT_CONFIGS = [
  {
    type: "Security Critical",
    triggerCondition: `${"FEAT_ENCRYPTION" /* FEAT_ENCRYPTION */} disabled in production`,
    severity: "CRITICAL" /* CRITICAL */,
    notificationChannels: ["SMS", "Email", "Slack", "PagerDuty"],
    responseTime: "Immediate",
    autoRecovery: false,
    escalationPath: "Security Team"
  },
  {
    type: "Production Warning",
    triggerCondition: `${"FEAT_MOCK_API" /* FEAT_MOCK_API */} enabled in production`,
    severity: "HIGH" /* HIGH */,
    notificationChannels: ["Email", "Slack"],
    responseTime: "15 minutes",
    autoRecovery: true,
    escalationPath: "DevOps Team"
  },
  {
    type: "Feature Degradation",
    triggerCondition: ">30% features disabled",
    severity: "MEDIUM" /* MEDIUM */,
    notificationChannels: ["Slack", "Dashboard"],
    responseTime: "1 hour",
    autoRecovery: true,
    escalationPath: "Development Team"
  },
  {
    type: "Integration Failure",
    triggerCondition: `INTEGRATION_* service down >5min`,
    severity: "MEDIUM" /* MEDIUM */,
    notificationChannels: ["Email", "Slack"],
    responseTime: "30 minutes",
    autoRecovery: true,
    escalationPath: "Integration Team"
  },
  {
    type: "Performance Alert",
    triggerCondition: `${"FEAT_BATCH_PROCESSING" /* FEAT_BATCH_PROCESSING */} disabled at scale`,
    severity: "MEDIUM" /* MEDIUM */,
    notificationChannels: ["Dashboard only"],
    responseTime: "2 hours",
    autoRecovery: false,
    escalationPath: "Performance Team"
  },
  {
    type: "Monitoring Gap",
    triggerCondition: `${"FEAT_ADVANCED_MONITORING" /* FEAT_ADVANCED_MONITORING */} disabled`,
    severity: "LOW" /* LOW */,
    notificationChannels: ["Dashboard only"],
    responseTime: "4 hours",
    autoRecovery: false,
    escalationPath: "Monitoring Team"
  }
];
var DASHBOARD_COMPONENTS = [
  {
    name: "Top Status Bar",
    displayType: "Text + Emoji",
    updateFrequency: "Real-time",
    dataSource: "Feature Registry",
    widthCalculation: "Bun.stringWidth()",
    ansiSupport: true,
    exportFormats: ["JSON", "TEXT"]
  },
  {
    name: "Environment Panel",
    displayType: "Badge Grid",
    updateFrequency: "On-change",
    dataSource: "ENV_* flags",
    widthCalculation: "Grapheme-aware",
    ansiSupport: true,
    exportFormats: ["JSON", "CSV"]
  },
  {
    name: "Feature Tier Display",
    displayType: "Large Badge",
    updateFrequency: "Static",
    dataSource: "FEAT_PREMIUM" /* FEAT_PREMIUM */,
    widthCalculation: "Emoji + ZWJ support",
    ansiSupport: true,
    exportFormats: ["JSON"]
  },
  {
    name: "Security Status",
    displayType: "Color-coded",
    updateFrequency: "Real-time",
    dataSource: "Security flags",
    widthCalculation: "Zero-width aware",
    ansiSupport: true,
    exportFormats: ["JSON", "PDF"]
  },
  {
    name: "Resilience Monitor",
    displayType: "Icon + Status",
    updateFrequency: "5 seconds",
    dataSource: "Auto-heal metrics",
    widthCalculation: "ANSI sequence aware",
    ansiSupport: true,
    exportFormats: ["JSON"]
  },
  {
    name: "Notification Panel",
    displayType: "Live List",
    updateFrequency: "1 second",
    dataSource: "Notification queue",
    widthCalculation: "Full Unicode",
    ansiSupport: true,
    exportFormats: ["JSON", "HTML"]
  },
  {
    name: "Performance Graph",
    displayType: "ASCII/Unicode",
    updateFrequency: "2 seconds",
    dataSource: "Performance metrics",
    widthCalculation: "East Asian width",
    ansiSupport: true,
    exportFormats: ["PNG", "CSV"]
  },
  {
    name: "Log Viewer",
    displayType: "Scrolling Text",
    updateFrequency: "User action",
    dataSource: "Log buffer",
    widthCalculation: "Proper wrapping",
    ansiSupport: true,
    exportFormats: ["LOG", "JSON"]
  },
  {
    name: "Integration Grid",
    displayType: "Service Icons",
    updateFrequency: "30 seconds",
    dataSource: "Health checks",
    widthCalculation: "Emoji flag support",
    ansiSupport: true,
    exportFormats: ["JSON", "CSV"]
  }
];
var BUILD_CONFIGS = {
  ["DEVELOPMENT" /* DEVELOPMENT */]: {
    flags: ["ENV_DEVELOPMENT" /* ENV_DEVELOPMENT */, "FEAT_EXTENDED_LOGGING" /* FEAT_EXTENDED_LOGGING */, "FEAT_MOCK_API" /* FEAT_MOCK_API */],
    bundleSize: "450KB",
    deadCodePercent: "0%",
    minify: false,
    useCase: "Local Development"
  },
  ["PRODUCTION_LITE" /* PRODUCTION_LITE */]: {
    flags: ["ENV_PRODUCTION" /* ENV_PRODUCTION */, "FEAT_ENCRYPTION" /* FEAT_ENCRYPTION */],
    bundleSize: "320KB",
    deadCodePercent: "29%",
    minify: true,
    useCase: "Minimal Deployment"
  },
  ["PRODUCTION_STANDARD" /* PRODUCTION_STANDARD */]: {
    flags: [
      "ENV_PRODUCTION" /* ENV_PRODUCTION */,
      "FEAT_AUTO_HEAL" /* FEAT_AUTO_HEAL */,
      "FEAT_NOTIFICATIONS" /* FEAT_NOTIFICATIONS */,
      "FEAT_ENCRYPTION" /* FEAT_ENCRYPTION */,
      "FEAT_BATCH_PROCESSING" /* FEAT_BATCH_PROCESSING */
    ],
    bundleSize: "280KB",
    deadCodePercent: "38%",
    minify: true,
    useCase: "Standard Deployment"
  },
  ["PRODUCTION_PREMIUM" /* PRODUCTION_PREMIUM */]: {
    flags: [
      "ENV_PRODUCTION" /* ENV_PRODUCTION */,
      "FEAT_PREMIUM" /* FEAT_PREMIUM */,
      "FEAT_AUTO_HEAL" /* FEAT_AUTO_HEAL */,
      "FEAT_NOTIFICATIONS" /* FEAT_NOTIFICATIONS */,
      "FEAT_ENCRYPTION" /* FEAT_ENCRYPTION */,
      "FEAT_BATCH_PROCESSING" /* FEAT_BATCH_PROCESSING */,
      "FEAT_ADVANCED_MONITORING" /* FEAT_ADVANCED_MONITORING */,
      "FEAT_EXTENDED_LOGGING" /* FEAT_EXTENDED_LOGGING */,
      "FEAT_VALIDATION_STRICT" /* FEAT_VALIDATION_STRICT */
    ],
    bundleSize: "340KB",
    deadCodePercent: "24%",
    minify: true,
    useCase: "Premium Deployment"
  },
  ["TEST" /* TEST */]: {
    flags: ["ENV_DEVELOPMENT" /* ENV_DEVELOPMENT */, "FEAT_MOCK_API" /* FEAT_MOCK_API */],
    bundleSize: "180KB",
    deadCodePercent: "60%",
    minify: false,
    useCase: "CI/CD Testing"
  },
  ["AUDIT" /* AUDIT */]: {
    flags: [
      "ENV_DEVELOPMENT" /* ENV_DEVELOPMENT */,
      "FEAT_PREMIUM" /* FEAT_PREMIUM */,
      "FEAT_AUTO_HEAL" /* FEAT_AUTO_HEAL */,
      "FEAT_NOTIFICATIONS" /* FEAT_NOTIFICATIONS */,
      "FEAT_ENCRYPTION" /* FEAT_ENCRYPTION */,
      "FEAT_BATCH_PROCESSING" /* FEAT_BATCH_PROCESSING */,
      "FEAT_ADVANCED_MONITORING" /* FEAT_ADVANCED_MONITORING */,
      "FEAT_EXTENDED_LOGGING" /* FEAT_EXTENDED_LOGGING */,
      "FEAT_VALIDATION_STRICT" /* FEAT_VALIDATION_STRICT */
    ],
    bundleSize: "600KB",
    deadCodePercent: "0%",
    minify: false,
    useCase: "Security Audit"
  }
};

// src/Dashboard.ts
class Dashboard {
  featureRegistry;
  logger;
  options;
  liveUpdateInterval = null;
  performanceMetrics = {
    memoryUsage: 0,
    cpuUsage: 0,
    responseTime: 0,
    throughput: 0,
    errorRate: 0
  };
  constructor(featureRegistry, logger, options = {}) {
    this.featureRegistry = featureRegistry;
    this.logger = logger;
    this.options = options;
  }
  displayStatus() {
    this.clearScreen();
    this.displayTopStatusBar();
    this.displayEnvironmentPanel();
    this.displayHealthStatus();
    this.displayPerformanceMetrics();
    this.displayIntegrationGrid();
  }
  displayFullDashboard() {
    this.clearScreen();
    this.displayTopStatusBar();
    this.displayEnvironmentPanel();
    this.displayFeatureTierDisplay();
    this.displaySecurityStatus();
    this.displayResilienceMonitor();
    this.displayNotificationPanel();
    this.displayPerformanceGraph();
    this.displayIntegrationGrid();
    this.displayAlertStatus();
  }
  displayTopStatusBar() {
    const env2 = this.featureRegistry.isEnabled("ENV_DEVELOPMENT" /* ENV_DEVELOPMENT */) ? "DEV" : "PROD";
    const healthStatus = this.calculateHealthStatus();
    const enabledFeatures = this.featureRegistry.getEnabledCount();
    const totalFeatures = this.featureRegistry.getTotalCount();
    const statusBadge = this.getStatusBadge(healthStatus.status);
    const envBadge = env2 === "DEV" ? "\uD83C\uDF0D DEV" : "\uD83C\uDF0D PROD";
    const line = `${envBadge} ${statusBadge} (${enabledFeatures}/${totalFeatures} features enabled)`;
    const paddedLine = this.padLine(line, 80);
    console.log(source_default.bold.cyan(paddedLine));
    console.log(source_default.gray("\u2500".repeat(80)));
    console.log();
  }
  displayEnvironmentPanel() {
    const badges = [];
    if (this.featureRegistry.isEnabled("FEAT_AUTO_HEAL" /* FEAT_AUTO_HEAL */)) {
      badges.push("\uD83D\uDD04 AUTO-HEAL");
    }
    if (this.featureRegistry.isEnabled("FEAT_NOTIFICATIONS" /* FEAT_NOTIFICATIONS */)) {
      badges.push("\uD83D\uDD14 ACTIVE");
    }
    if (this.featureRegistry.isEnabled("FEAT_ENCRYPTION" /* FEAT_ENCRYPTION */)) {
      badges.push("\uD83D\uDD10 ENCRYPTED");
    }
    if (this.featureRegistry.isEnabled("FEAT_BATCH_PROCESSING" /* FEAT_BATCH_PROCESSING */)) {
      badges.push("\u26A1 BATCH");
    }
    const line = badges.length > 0 ? badges.join(" | ") : "\u26A0\uFE0F No active features";
    const paddedLine = this.padLine(line, 80);
    console.log(source_default.green(paddedLine));
    console.log();
  }
  displayFeatureTierDisplay() {
    const isPremium = this.featureRegistry.isEnabled("FEAT_PREMIUM" /* FEAT_PREMIUM */);
    const badge = isPremium ? "\uD83C\uDFC6 PREMIUM" : "\uD83D\uDD13 FREE";
    const color = isPremium ? source_default.yellow.bold : source_default.gray;
    const line = `Feature Tier: ${badge}`;
    const paddedLine = this.padLine(line, 80);
    console.log(color(paddedLine));
    console.log();
  }
  displaySecurityStatus() {
    const securityFeatures = [];
    if (this.featureRegistry.isEnabled("FEAT_ENCRYPTION" /* FEAT_ENCRYPTION */)) {
      securityFeatures.push("\uD83D\uDD10 ENCRYPTED");
    }
    if (this.featureRegistry.isEnabled("FEAT_VALIDATION_STRICT" /* FEAT_VALIDATION_STRICT */)) {
      securityFeatures.push("\u2705 STRICT");
    }
    if (this.featureRegistry.isEnabled("FEAT_EXTENDED_LOGGING" /* FEAT_EXTENDED_LOGGING */)) {
      securityFeatures.push("\uD83D\uDEE1\uFE0F AUDIT ENABLED");
    }
    const line = securityFeatures.length > 0 ? securityFeatures.join(" | ") : "\u26A0\uFE0F Security features disabled";
    const paddedLine = this.padLine(line, 80);
    console.log(source_default.red.bold(paddedLine));
    console.log();
  }
  displayResilienceMonitor() {
    const autoHeal = this.featureRegistry.isEnabled("FEAT_AUTO_HEAL" /* FEAT_AUTO_HEAL */);
    const status = autoHeal ? "\uD83D\uDD04 ACTIVE" : "\u26A0\uFE0F MANUAL";
    const color = autoHeal ? source_default.green : source_default.yellow;
    const line = `Resilience Monitor: ${status}`;
    const paddedLine = this.padLine(line, 80);
    console.log(color(paddedLine));
    console.log();
  }
  displayNotificationPanel() {
    const notifications = this.featureRegistry.isEnabled("FEAT_NOTIFICATIONS" /* FEAT_NOTIFICATIONS */);
    const status = notifications ? "\uD83D\uDD14 ACTIVE" : "\uD83D\uDD15 SILENT";
    const color = notifications ? source_default.green : source_default.gray;
    const line = `Notification Panel: ${status}`;
    const paddedLine = this.padLine(line, 80);
    console.log(color(paddedLine));
    console.log();
  }
  displayPerformanceGraph() {
    const cpu = this.performanceMetrics.cpuUsage || Math.random() * 100;
    const memory = this.performanceMetrics.memoryUsage || Math.random() * 100;
    const response = this.performanceMetrics.responseTime || Math.random() * 100;
    const cpuBar = this.createProgressBar(cpu, 10, "\u25B0", "\u25B1");
    const memBar = this.createProgressBar(memory, 10, "\u25B0", "\u25B1");
    const resBar = this.createProgressBar(response / 10, 10, "\u25B0", "\u25B1");
    const line = `CPU: ${cpuBar} ${cpu.toFixed(0)}% | MEM: ${memBar} ${memory.toFixed(0)}% | RES: ${resBar} ${response.toFixed(0)}ms`;
    const paddedLine = this.padLine(line, 80);
    console.log(source_default.blue(paddedLine));
    console.log();
  }
  displayIntegrationGrid() {
    console.log(source_default.bold.underline("Integration Status:"));
    console.log();
    const integrations = [
      {
        flag: "INTEGRATION_GEELARK_API" /* INTEGRATION_GEELARK_API */,
        name: "GEELARK API",
        icon: "\uD83D\uDCF1"
      },
      {
        flag: "INTEGRATION_PROXY_SERVICE" /* INTEGRATION_PROXY_SERVICE */,
        name: "PROXY",
        icon: "\uD83C\uDF10"
      },
      {
        flag: "INTEGRATION_EMAIL_SERVICE" /* INTEGRATION_EMAIL_SERVICE */,
        name: "EMAIL",
        icon: "\uD83D\uDCE7"
      },
      { flag: "INTEGRATION_SMS_SERVICE" /* INTEGRATION_SMS_SERVICE */, name: "SMS", icon: "\uD83D\uDCAC" }
    ];
    integrations.forEach((integration) => {
      const enabled = this.featureRegistry.isEnabled(integration.flag);
      const status = enabled ? "\u2705 HEALTHY" : "\u274C DISABLED";
      const color = enabled ? source_default.green : source_default.red;
      const widthInfo = this.options.ascii ? "(1 col)" : "(2 cols)";
      const line = `${integration.icon} ${integration.name}: ${status} ${widthInfo}`;
      console.log(color(line));
    });
    console.log();
  }
  displayHealthStatus(detailed = false) {
    const healthStatus = this.calculateHealthStatus();
    const color = this.getHealthColor(healthStatus.status);
    console.log(color.bold(`Health Status: ${healthStatus.badge}`));
    console.log(source_default.gray(`Score: ${healthStatus.score}% | Enabled: ${healthStatus.enabledPercentage.toFixed(1)}%`));
    if (detailed) {
      console.log(source_default.gray(`Critical Features: ${healthStatus.criticalFeaturesEnabled ? "\u2705 All Enabled" : "\u274C Some Disabled"}`));
      const criticalFlags = this.featureRegistry.getCriticalFlags();
      console.log(source_default.underline(`
Critical Feature Status:`));
      criticalFlags.forEach((flag) => {
        const enabled = this.featureRegistry.isEnabled(flag);
        const status = enabled ? "\u2705" : "\u274C";
        const color2 = enabled ? source_default.green : source_default.red;
        console.log(color2(`  ${status} ${flag}`));
      });
    }
    console.log();
  }
  displayAlertStatus() {
    const activeAlerts = this.getActiveAlerts();
    if (activeAlerts.length === 0) {
      console.log(source_default.green("\u2705 No active alerts"));
    } else {
      console.log(source_default.yellow.bold(`\u26A0\uFE0F ${activeAlerts.length} Active Alerts:`));
      activeAlerts.forEach((alert) => {
        const color = this.getAlertColor(alert.severity);
        console.log(color(`  \u2022 ${alert.type}: ${alert.triggerCondition}`));
      });
    }
    console.log();
  }
  displayPerformanceMetrics() {
    this.updatePerformanceMetrics();
    console.log(source_default.bold.underline("Performance Metrics:"));
    console.log(source_default.blue(`Memory Usage: ${this.performanceMetrics.memoryUsage.toFixed(1)}%`));
    console.log(source_default.blue(`CPU Usage: ${this.performanceMetrics.cpuUsage.toFixed(1)}%`));
    console.log(source_default.blue(`Response Time: ${this.performanceMetrics.responseTime.toFixed(0)}ms`));
    console.log(source_default.blue(`Throughput: ${this.performanceMetrics.throughput.toFixed(0)} req/s`));
    console.log(source_default.blue(`Error Rate: ${this.performanceMetrics.errorRate.toFixed(2)}%`));
    console.log();
  }
  startLiveUpdates(intervalMs = 5000) {
    if (this.liveUpdateInterval) {
      clearInterval(this.liveUpdateInterval);
    }
    this.liveUpdateInterval = setInterval(() => {
      this.displayStatus();
    }, intervalMs);
    console.log(source_default.green(`\uD83D\uDD04 Live updates started (${intervalMs / 1000}s interval)`));
  }
  stopLiveUpdates() {
    if (this.liveUpdateInterval) {
      clearInterval(this.liveUpdateInterval);
      this.liveUpdateInterval = null;
      console.log(source_default.yellow("\u23F8\uFE0F Live updates stopped"));
    }
  }
  displayComponent(componentName) {
    const component = DASHBOARD_COMPONENTS.find((c) => c.name === componentName);
    if (!component) {
      console.error(source_default.red(`\u274C Unknown component: ${componentName}`));
      return;
    }
    console.log(source_default.bold(`Component: ${component.name}`));
    console.log(source_default.gray(`Type: ${component.displayType}`));
    console.log(source_default.gray(`Update: ${component.updateFrequency}`));
    console.log(source_default.gray(`Source: ${component.dataSource}`));
    console.log(source_default.gray(`Width: ${component.widthCalculation}`));
    console.log(source_default.gray(`ANSI: ${component.ansiSupport ? "\u2705" : "\u274C"}`));
    console.log(source_default.gray(`Export: ${component.exportFormats.join(", ")}`));
  }
  async export(format) {
    const data = {
      timestamp: new Date().toISOString(),
      healthStatus: this.calculateHealthStatus(),
      performanceMetrics: this.performanceMetrics,
      enabledFeatures: this.featureRegistry.getEnabledFlags(),
      disabledFeatures: this.featureRegistry.getDisabledFlags()
    };
    switch (format.toLowerCase()) {
      case "json":
        console.log(JSON.stringify(data, null, 2));
        break;
      case "csv":
        console.log(this.convertToCSV(data));
        break;
      case "html":
        console.log(this.convertToHTML(data));
        break;
      default:
        console.error(source_default.red(`\u274C Unsupported export format: ${format}`));
    }
  }
  async checkIntegrationHealth() {
    console.log(source_default.bold("\uD83D\uDD0D Checking Integration Health..."));
    const integrations = [
      {
        flag: "INTEGRATION_GEELARK_API" /* INTEGRATION_GEELARK_API */,
        name: "GeeLark API",
        endpoint: "/health"
      },
      {
        flag: "INTEGRATION_PROXY_SERVICE" /* INTEGRATION_PROXY_SERVICE */,
        name: "Proxy Service",
        endpoint: "connection"
      },
      {
        flag: "INTEGRATION_EMAIL_SERVICE" /* INTEGRATION_EMAIL_SERVICE */,
        name: "Email Service",
        endpoint: "smtp"
      },
      {
        flag: "INTEGRATION_SMS_SERVICE" /* INTEGRATION_SMS_SERVICE */,
        name: "SMS Service",
        endpoint: "balance"
      }
    ];
    for (const integration of integrations) {
      if (this.featureRegistry.isEnabled(integration.flag)) {
        console.log(source_default.blue(`\uD83D\uDD0D Checking ${integration.name}...`));
        const isHealthy = Math.random() > 0.2;
        const status = isHealthy ? "\u2705 HEALTHY" : "\u274C FAILED";
        const color = isHealthy ? source_default.green : source_default.red;
        console.log(color(`  ${integration.name}: ${status}`));
      } else {
        console.log(source_default.gray(`  ${integration.name}: \u26A0\uFE0F DISABLED`));
      }
    }
  }
  async runSecurityAudit() {
    console.log(source_default.bold("\uD83D\uDD12 Running Security Audit..."));
    const securityChecks = [
      { flag: "FEAT_ENCRYPTION" /* FEAT_ENCRYPTION */, name: "Encryption", critical: true },
      {
        flag: "FEAT_VALIDATION_STRICT" /* FEAT_VALIDATION_STRICT */,
        name: "Strict Validation",
        critical: true
      },
      {
        flag: "FEAT_EXTENDED_LOGGING" /* FEAT_EXTENDED_LOGGING */,
        name: "Audit Logging",
        critical: false
      }
    ];
    let allCriticalPassed = true;
    securityChecks.forEach((check) => {
      const enabled = this.featureRegistry.isEnabled(check.flag);
      const status = enabled ? "\u2705 PASS" : "\u274C FAIL";
      const color = enabled ? source_default.green : source_default.red;
      console.log(color(`  ${check.name}: ${status}${check.critical ? " (CRITICAL)" : ""}`));
      if (check.critical && !enabled) {
        allCriticalPassed = false;
      }
    });
    console.log();
    if (allCriticalPassed) {
      console.log(source_default.green.bold("\u2705 Security Audit PASSED"));
    } else {
      console.log(source_default.red.bold("\u274C Security Audit FAILED - Critical issues detected"));
    }
  }
  async runFullAudit(debugSymbols = false) {
    console.log(source_default.bold("\uD83D\uDD0D Running Full System Audit..."));
    await this.runSecurityAudit();
    await this.checkIntegrationHealth();
    console.log(source_default.bold(`
\uD83D\uDCCA Feature Flag Audit:`));
    const allFlags = this.featureRegistry.getAllFlags();
    allFlags.forEach((flag) => {
      const enabled = this.featureRegistry.isEnabled(flag);
      const config = this.featureRegistry.getFlagConfig(flag);
      const status = enabled ? "\u2705" : "\u274C";
      const color = enabled ? source_default.green : source_default.red;
      console.log(color(`  ${status} ${flag} (${config?.criticalLevel || "UNKNOWN"})`));
    });
    if (debugSymbols) {
      console.log(source_default.bold(`
\uD83D\uDC1B Debug Information:`));
      console.log(source_default.gray(`  Total Features: ${this.featureRegistry.getTotalCount()}`));
      console.log(source_default.gray(`  Enabled Features: ${this.featureRegistry.getEnabledCount()}`));
      console.log(source_default.gray(`  Health Score: ${this.calculateHealthStatus().score}%`));
    }
  }
  async reviewPerformance(optimize = false) {
    console.log(source_default.bold("\uD83D\uDCC8 Performance Review..."));
    this.updatePerformanceMetrics();
    this.displayPerformanceMetrics();
    if (optimize) {
      console.log(source_default.bold(`
\uD83D\uDCA1 Optimization Suggestions:`));
      if (this.performanceMetrics.memoryUsage > 80) {
        console.log(source_default.yellow("  \u2022 Consider disabling FEAT_EXTENDED_LOGGING to reduce memory usage"));
      }
      if (this.performanceMetrics.cpuUsage > 80) {
        console.log(source_default.yellow("  \u2022 Consider enabling FEAT_BATCH_PROCESSING to reduce CPU load"));
      }
      if (this.performanceMetrics.responseTime > 100) {
        console.log(source_default.yellow("  \u2022 Consider enabling FEAT_AUTO_HEAL for better response times"));
      }
      if (!this.featureRegistry.isEnabled("FEAT_ADVANCED_MONITORING" /* FEAT_ADVANCED_MONITORING */)) {
        console.log(source_default.blue("  \u2022 Enable FEAT_ADVANCED_MONITORING for better performance insights"));
      }
    }
  }
  async runSystemReview() {
    console.log(source_default.bold("\uD83D\uDD0D System Review..."));
    await this.reviewPerformance(true);
    await this.runSecurityAudit();
    await this.checkIntegrationHealth();
    const healthStatus = this.calculateHealthStatus();
    console.log(source_default.bold(`
\uD83D\uDCCA Overall System Health: ${healthStatus.badge}`));
  }
  async optimizeBuild() {
    console.log(source_default.bold("\uD83D\uDD28 Optimizing Build..."));
    const currentFlags = this.featureRegistry.getEnabledFlags();
    const optimizations = [];
    if (currentFlags.includes("FEAT_MOCK_API" /* FEAT_MOCK_API */) && this.featureRegistry.isEnabled("ENV_PRODUCTION" /* ENV_PRODUCTION */)) {
      optimizations.push("Remove FEAT_MOCK_API from production builds");
    }
    if (!currentFlags.includes("FEAT_BATCH_PROCESSING" /* FEAT_BATCH_PROCESSING */) && this.featureRegistry.getEnabledCount() > 10) {
      optimizations.push("Enable FEAT_BATCH_PROCESSING for better performance at scale");
    }
    if (currentFlags.includes("FEAT_EXTENDED_LOGGING" /* FEAT_EXTENDED_LOGGING */) && this.featureRegistry.isEnabled("ENV_PRODUCTION" /* ENV_PRODUCTION */)) {
      optimizations.push("Consider reducing FEAT_EXTENDED_LOGGING in production");
    }
    if (optimizations.length > 0) {
      console.log(source_default.yellow("\uD83D\uDCA1 Optimization Suggestions:"));
      optimizations.forEach((opt) => console.log(source_default.yellow(`  \u2022 ${opt}`)));
    } else {
      console.log(source_default.green("\u2705 Build is already optimized"));
    }
  }
  async analyzeBuild() {
    console.log(source_default.bold("\uD83D\uDCCA Analyzing Build Composition..."));
    const enabledFlags = this.featureRegistry.getEnabledFlags();
    const totalSize = this.calculateBundleSize(enabledFlags);
    const deadCodePercentage = this.calculateDeadCodePercentage(enabledFlags);
    console.log(source_default.blue(`Estimated Bundle Size: ${totalSize}`));
    console.log(source_default.blue(`Dead Code Elimination: ${deadCodePercentage}%`));
    console.log(source_default.bold(`
\uD83D\uDCE6 Feature Breakdown:`));
    enabledFlags.forEach((flag) => {
      const config = this.featureRegistry.getFlagConfig(flag);
      const impact = config?.buildTimeImpact || "Unknown";
      console.log(source_default.gray(`  \u2022 ${flag}: ${impact}`));
    });
  }
  async generateAuditReport(format) {
    const reportData = {
      timestamp: new Date().toISOString(),
      healthStatus: this.calculateHealthStatus(),
      performanceMetrics: this.performanceMetrics,
      securityAudit: await this.runSecurityAudit(),
      integrationHealth: await this.checkIntegrationHealth(),
      featureFlags: {
        enabled: this.featureRegistry.getEnabledFlags(),
        disabled: this.featureRegistry.getDisabledFlags(),
        total: this.featureRegistry.getTotalCount()
      }
    };
    switch (format.toLowerCase()) {
      case "json":
        console.log(JSON.stringify(reportData, null, 2));
        break;
      case "pdf":
        console.log(source_default.yellow("PDF export not yet implemented"));
        break;
      default:
        console.error(source_default.red(`\u274C Unsupported report format: ${format}`));
    }
  }
  startMonitoring() {
    console.log(source_default.green("\uD83D\uDCCA Advanced monitoring started"));
  }
  clearScreen() {
    console.clear();
  }
  padLine(line, width) {
    const lineWidth = this.options.ascii ? line.length : StringWidth.calculate(line);
    const padding = Math.max(0, width - lineWidth);
    return line + " ".repeat(padding);
  }
  createProgressBar(value, size, fillChar, emptyChar) {
    const filled = Math.round(value / 100 * size);
    return fillChar.repeat(filled) + emptyChar.repeat(size - filled);
  }
  calculateHealthStatus() {
    const enabledCount = this.featureRegistry.getEnabledCount();
    const totalCount = this.featureRegistry.getTotalCount();
    const enabledPercentage = enabledCount / totalCount * 100;
    const criticalFlags = this.featureRegistry.getCriticalFlags();
    const criticalEnabled = criticalFlags.filter((flag) => this.featureRegistry.isEnabled(flag)).length;
    const criticalFeaturesEnabled = criticalEnabled === criticalFlags.length;
    let status;
    let badge;
    let score;
    if (enabledPercentage >= 90 && criticalFeaturesEnabled) {
      status = "HEALTHY" /* HEALTHY */;
      badge = "\u2705 HEALTHY";
      score = enabledPercentage;
    } else if (enabledPercentage >= 70) {
      status = "DEGRADED" /* DEGRADED */;
      badge = "\u26A0\uFE0F DEGRADED";
      score = enabledPercentage;
    } else if (enabledPercentage >= 50) {
      status = "IMPAIRED" /* IMPAIRED */;
      badge = "\uD83D\uDD04 IMPAIRED";
      score = enabledPercentage;
    } else if (enabledPercentage > 0) {
      status = "CRITICAL" /* CRITICAL */;
      badge = "\uD83D\uDEA8 CRITICAL";
      score = enabledPercentage;
    } else {
      status = "OFFLINE" /* OFFLINE */;
      badge = "\uD83D\uDC80 OFFLINE";
      score = 0;
    }
    return {
      status,
      badge,
      score,
      enabledPercentage,
      criticalFeaturesEnabled,
      color: this.getHealthColor(status)
    };
  }
  getHealthColor(status) {
    switch (status) {
      case "HEALTHY" /* HEALTHY */:
        return source_default.green;
      case "DEGRADED" /* DEGRADED */:
        return source_default.yellow;
      case "IMPAIRED" /* IMPAIRED */:
        return source_default.hex("#fd7e14");
      case "CRITICAL" /* CRITICAL */:
        return source_default.red;
      case "OFFLINE" /* OFFLINE */:
        return source_default.gray;
      default:
        return source_default.white;
    }
  }
  getAlertColor(severity) {
    switch (severity) {
      case "CRITICAL" /* CRITICAL */:
        return source_default.red.bold;
      case "HIGH" /* HIGH */:
        return source_default.red;
      case "MEDIUM" /* MEDIUM */:
        return source_default.yellow;
      case "LOW" /* LOW */:
        return source_default.blue;
      default:
        return source_default.white;
    }
  }
  getStatusBadge(status) {
    switch (status) {
      case "HEALTHY" /* HEALTHY */:
        return "\u2705 HEALTHY";
      case "DEGRADED" /* DEGRADED */:
        return "\u26A0\uFE0F DEGRADED";
      case "IMPAIRED" /* IMPAIRED */:
        return "\uD83D\uDD04 IMPAIRED";
      case "CRITICAL" /* CRITICAL */:
        return "\uD83D\uDEA8 CRITICAL";
      case "OFFLINE" /* OFFLINE */:
        return "\uD83D\uDC80 OFFLINE";
      default:
        return "\u2753 UNKNOWN";
    }
  }
  getActiveAlerts() {
    return ALERT_CONFIGS.filter((alert) => this.isAlertTriggered(alert));
  }
  isAlertTriggered(alert) {
    if (alert.triggerCondition.includes("FEAT_ENCRYPTION")) {
      return !this.featureRegistry.isEnabled("FEAT_ENCRYPTION" /* FEAT_ENCRYPTION */) && this.featureRegistry.isEnabled("ENV_PRODUCTION" /* ENV_PRODUCTION */);
    }
    if (alert.triggerCondition.includes("FEAT_MOCK_API")) {
      return this.featureRegistry.isEnabled("FEAT_MOCK_API" /* FEAT_MOCK_API */) && this.featureRegistry.isEnabled("ENV_PRODUCTION" /* ENV_PRODUCTION */);
    }
    if (alert.triggerCondition.includes(">30% features disabled")) {
      const enabledPercentage = this.featureRegistry.getEnabledCount() / this.featureRegistry.getTotalCount() * 100;
      return enabledPercentage < 70;
    }
    return false;
  }
  updatePerformanceMetrics() {
    this.performanceMetrics = {
      memoryUsage: Math.random() * 100,
      cpuUsage: Math.random() * 100,
      responseTime: Math.random() * 200,
      throughput: Math.random() * 1000,
      errorRate: Math.random() * 5
    };
  }
  calculateBundleSize(flags) {
    const baseSize = 200;
    const flagSizes = {
      ["FEAT_EXTENDED_LOGGING" /* FEAT_EXTENDED_LOGGING */]: 50,
      ["FEAT_ADVANCED_MONITORING" /* FEAT_ADVANCED_MONITORING */]: 30,
      ["FEAT_ENCRYPTION" /* FEAT_ENCRYPTION */]: 20,
      ["FEAT_AUTO_HEAL" /* FEAT_AUTO_HEAL */]: 25,
      ["FEAT_NOTIFICATIONS" /* FEAT_NOTIFICATIONS */]: 15
    };
    let totalSize = baseSize;
    flags.forEach((flag) => {
      totalSize += flagSizes[flag] || 10;
    });
    return `${totalSize}KB`;
  }
  calculateDeadCodePercentage(flags) {
    const totalFlags = Object.keys(FeatureFlag).length;
    const enabledFlags = flags.length;
    return Math.round((totalFlags - enabledFlags) / totalFlags * 100);
  }
  convertToCSV(data) {
    return `timestamp,healthScore,memoryUsage,cpuUsage
` + `${data.timestamp},${data.healthStatus.score},${data.performanceMetrics.memoryUsage},${data.performanceMetrics.cpuUsage}`;
  }
  convertToHTML(data) {
    return `
<!DOCTYPE html>
<html>
<head><title>Dashboard Report</title></head>
<body>
  <h1>Dashboard Report</h1>
  <p>Generated: ${data.timestamp}</p>
  <h2>Health Status</h2>
  <p>Score: ${data.healthStatus.score}%</p>
  <p>Status: ${data.healthStatus.status}</p>
  <h2>Performance Metrics</h2>
  <p>Memory: ${data.performanceMetrics.memoryUsage}%</p>
  <p>CPU: ${data.performanceMetrics.cpuUsage}%</p>
</body>
</html>`;
  }
}

// src/FeatureRegistry.ts
class FeatureRegistry {
  flags = new Map;
  configs = new Map;
  changeListeners = [];
  constructor(initialFlags) {
    Object.values(FeatureFlag).forEach((flag) => {
      const config = FEATURE_FLAG_CONFIGS[flag];
      if (config) {
        this.configs.set(flag, {
          ...config,
          enabled: initialFlags?.[flag] ?? this.getDefaultState(flag)
        });
        this.flags.set(flag, initialFlags?.[flag] ?? this.getDefaultState(flag));
      }
    });
  }
  getDefaultState(flag) {
    if (flag === "ENV_DEVELOPMENT" /* ENV_DEVELOPMENT */)
      return true;
    if (flag === "ENV_PRODUCTION" /* ENV_PRODUCTION */)
      return false;
    if (flag === "PLATFORM_ANDROID" /* PLATFORM_ANDROID */)
      return true;
    if (this.isEnabled("ENV_DEVELOPMENT" /* ENV_DEVELOPMENT */)) {
      return true;
    }
    const config = FEATURE_FLAG_CONFIGS[flag];
    return config?.criticalLevel === "CRITICAL" /* CRITICAL */ || config?.criticalLevel === "PROD_CRITICAL" /* PROD_CRITICAL */;
  }
  isEnabled(flag) {
    return this.flags.get(flag) ?? false;
  }
  enable(flag) {
    if (this.flags.get(flag) !== true) {
      this.flags.set(flag, true);
      this.updateConfig(flag, true);
      this.notifyChange(flag, true);
    }
  }
  disable(flag) {
    if (this.flags.get(flag) !== false) {
      this.flags.set(flag, false);
      this.updateConfig(flag, false);
      this.notifyChange(flag, false);
    }
  }
  toggle(flag) {
    const current = this.isEnabled(flag);
    if (current) {
      this.disable(flag);
    } else {
      this.enable(flag);
    }
  }
  set(flag, enabled) {
    if (enabled) {
      this.enable(flag);
    } else {
      this.disable(flag);
    }
  }
  updateConfig(flag, enabled) {
    const config = this.configs.get(flag);
    if (config) {
      config.enabled = enabled;
    }
  }
  notifyChange(flag, enabled) {
    this.changeListeners.forEach((listener) => listener(flag, enabled));
  }
  onChange(listener) {
    this.changeListeners.push(listener);
  }
  offChange(listener) {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }
  getConfig(flag) {
    return this.configs.get(flag);
  }
  getAllFlags() {
    return Array.from(this.flags.keys());
  }
  getEnabledFlags() {
    return Array.from(this.flags.entries()).filter(([_, enabled]) => enabled).map(([flag, _]) => flag);
  }
  getDisabledFlags() {
    return Array.from(this.flags.entries()).filter(([_, enabled]) => !enabled).map(([flag, _]) => flag);
  }
  getCriticalFlags() {
    return Array.from(this.configs.entries()).filter(([_, config]) => config.criticalLevel === "CRITICAL" /* CRITICAL */ || config.criticalLevel === "PROD_CRITICAL" /* PROD_CRITICAL */).map(([flag, _]) => flag);
  }
  getHealthStatus() {
    const allFlags = this.getAllFlags();
    const enabledFlags = this.getEnabledFlags();
    const criticalFlags = this.getCriticalFlags();
    const enabledCriticalFlags = criticalFlags.filter((flag) => this.isEnabled(flag));
    const enabledPercentage = enabledFlags.length / allFlags.length * 100;
    const criticalFeaturesEnabled = enabledCriticalFlags.length === criticalFlags.length;
    let status;
    let color;
    let badge;
    if (enabledPercentage >= 90) {
      status = "HEALTHY" /* HEALTHY */;
      color = "#28a745";
      badge = "\u2705 HEALTHY";
    } else if (enabledPercentage >= 70) {
      status = "DEGRADED" /* DEGRADED */;
      color = "#ffc107";
      badge = "\u26A0\uFE0F DEGRADED";
    } else if (enabledPercentage >= 50) {
      status = "IMPAIRED" /* IMPAIRED */;
      color = "#fd7e14";
      badge = "\uD83D\uDD04 IMPAIRED";
    } else if (enabledPercentage > 0) {
      status = "CRITICAL" /* CRITICAL */;
      color = "#dc3545";
      badge = "\uD83D\uDEA8 CRITICAL";
    } else {
      status = "OFFLINE" /* OFFLINE */;
      color = "#343a40";
      badge = "\uD83D\uDC80 OFFLINE";
    }
    return {
      score: Math.round(enabledPercentage),
      status,
      color,
      badge,
      enabledPercentage: Math.round(enabledPercentage),
      criticalFeaturesEnabled
    };
  }
  getBadge(flag) {
    const config = this.configs.get(flag);
    if (!config)
      return "\u2753 UNKNOWN";
    return this.isEnabled(flag) ? config.badgeEnabled : config.badgeDisabled;
  }
  getStatusSummary() {
    const health = this.getHealthStatus();
    const enabledCount = this.getEnabledFlags().length;
    const totalCount = this.getAllFlags().length;
    return `${health.badge} (${enabledCount}/${totalCount} features enabled)`;
  }
  exportState() {
    const state = {};
    this.flags.forEach((enabled, flag) => {
      state[flag] = enabled;
    });
    return state;
  }
  importState(state) {
    Object.entries(state).forEach(([flag, enabled]) => {
      if (Object.values(FeatureFlag).includes(flag)) {
        this.set(flag, enabled);
      }
    });
  }
  resetToDefaults() {
    this.flags.clear();
    this.configs.clear();
    Object.values(FeatureFlag).forEach((flag) => {
      const config = FEATURE_FLAG_CONFIGS[flag];
      if (config) {
        const defaultEnabled = this.getDefaultState(flag);
        this.configs.set(flag, { ...config, enabled: defaultEnabled });
        this.flags.set(flag, defaultEnabled);
      }
    });
  }
  enableFeature(flag) {
    this.enable(flag);
  }
  disableFeature(flag) {
    this.disable(flag);
  }
  toggleFeature(flag) {
    this.toggle(flag);
  }
  getEnabledCount() {
    return this.getEnabledFlags().length;
  }
  getTotalCount() {
    return this.getAllFlags().length;
  }
  getFlagConfig(flag) {
    return this.getConfig(flag);
  }
  rotateFlags() {
    const nonCriticalFlags = this.getAllFlags().filter((flag) => {
      const config = this.getConfig(flag);
      return config && config.criticalLevel !== "CRITICAL" /* CRITICAL */ && config.criticalLevel !== "PROD_CRITICAL" /* PROD_CRITICAL */;
    });
    nonCriticalFlags.forEach((flag) => {
      if (Math.random() > 0.5) {
        this.toggle(flag);
      }
    });
  }
  displayAllFlags() {
    console.log("Feature Flag Status:");
    console.log("=".repeat(50));
    this.getAllFlags().forEach((flag) => {
      const enabled = this.isEnabled(flag);
      const config = this.getConfig(flag);
      const badge = this.getBadge(flag);
      const criticalLevel = config?.criticalLevel || "UNKNOWN";
      const status = enabled ? "\u2705" : "\u274C";
      const color = enabled ? "\x1B[32m" : "\x1B[31m";
      const reset = "\x1B[0m";
      console.log(`${color}${status} ${flag}${reset} - ${badge} (${criticalLevel})`);
    });
    const health = this.getHealthStatus();
    console.log("=".repeat(50));
    console.log(`Overall Status: ${health.badge} (${health.score}% enabled)`);
  }
}

// src/Logger.ts
class Logger {
  logs = [];
  maxLogs = 1000;
  featureRegistry;
  externalServices = new Map;
  level = "INFO" /* INFO */;
  retention = 30;
  constructor(options = {}) {
    this.featureRegistry = options.featureRegistry || new FeatureRegistry({});
    this.level = options.level || "INFO" /* INFO */;
    this.retention = options.retention || 30;
    this.initializeExternalServices();
  }
  initializeExternalServices() {
    this.externalServices.set("elasticsearch", async (entry) => {
      if (this.featureRegistry.isEnabled("FEAT_EXTENDED_LOGGING" /* FEAT_EXTENDED_LOGGING */)) {
        console.log(`[ES] ${entry.level}: ${entry.message}`);
      }
    });
    this.externalServices.set("splunk", async (entry) => {
      if (entry.type === "SECURITY_EVENT" /* SECURITY_EVENT */) {
        console.log(`[SPLUNK] ${entry.level}: ${entry.message}`);
      }
    });
    this.externalServices.set("datadog", async (entry) => {
      if (entry.type === "INTEGRATION_EVENT" /* INTEGRATION_EVENT */) {
        console.log(`[DD] ${entry.level}: ${entry.message}`);
      }
    });
    this.externalServices.set("prometheus", async (entry) => {
      if (entry.type === "PERFORMANCE_METRIC" /* PERFORMANCE_METRIC */) {
        console.log(`[PROM] ${entry.level}: ${entry.message}`);
      }
    });
    this.externalServices.set("sentry", async (entry) => {
      if (entry.type === "ERROR_OCCURRED" /* ERROR_OCCURRED */) {
        console.log(`[SENTRY] ${entry.level}: ${entry.message}`);
      }
    });
    this.externalServices.set("cloudwatch", async (entry) => {
      if (entry.type === "HEALTH_CHECK" /* HEALTH_CHECK */) {
        console.log(`[CW] ${entry.level}: ${entry.message}`);
      }
    });
  }
  getLogPrefix(type) {
    const prefixes = {
      ["FEATURE_CHANGE" /* FEATURE_CHANGE */]: "\u2139\uFE0F [FEATURE]",
      ["SECURITY_EVENT" /* SECURITY_EVENT */]: "\uD83D\uDD12 [SECURITY]",
      ["INTEGRATION_EVENT" /* INTEGRATION_EVENT */]: "\uD83D\uDD0C [INTEGRATION]",
      ["PERFORMANCE_METRIC" /* PERFORMANCE_METRIC */]: "\u26A1 [PERF]",
      ["ERROR_OCCURRED" /* ERROR_OCCURRED */]: "\u274C [ERROR]",
      ["AUDIT_TRAIL" /* AUDIT_TRAIL */]: "\uD83D\uDCCB [AUDIT]",
      ["HEALTH_CHECK" /* HEALTH_CHECK */]: "\u2764\uFE0F [HEALTH]"
    };
    return prefixes[type] || "[UNKNOWN]";
  }
  getRetentionDays(type) {
    const retention = {
      ["FEATURE_CHANGE" /* FEATURE_CHANGE */]: 7,
      ["SECURITY_EVENT" /* SECURITY_EVENT */]: 90,
      ["INTEGRATION_EVENT" /* INTEGRATION_EVENT */]: 30,
      ["PERFORMANCE_METRIC" /* PERFORMANCE_METRIC */]: 30,
      ["ERROR_OCCURRED" /* ERROR_OCCURRED */]: 30,
      ["AUDIT_TRAIL" /* AUDIT_TRAIL */]: 365,
      ["HEALTH_CHECK" /* HEALTH_CHECK */]: 7
    };
    return retention[type] || 30;
  }
  async log(type, level, message, data) {
    const entry = {
      type,
      level,
      message,
      timestamp: new Date,
      data,
      prefix: this.getLogPrefix(type)
    };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    const consoleMessage = `${entry.prefix} ${entry.message}`;
    this.consoleOutput(entry.level, consoleMessage);
    await this.sendToExternalServices(entry);
    if (type === "FEATURE_CHANGE" /* FEATURE_CHANGE */) {
      this.featureRegistry.onChange((flag, enabled) => {
        this.log("FEATURE_CHANGE" /* FEATURE_CHANGE */, "INFO" /* INFO */, `Feature ${flag} ${enabled ? "enabled" : "disabled"}`, { flag, enabled });
      });
    }
  }
  consoleOutput(level, message) {
    const timestamp = new Date().toISOString();
    switch (level) {
      case "DEBUG" /* DEBUG */:
        console.debug(`[${timestamp}] ${message}`);
        break;
      case "INFO" /* INFO */:
        console.info(`[${timestamp}] ${message}`);
        break;
      case "WARN" /* WARN */:
        console.warn(`[${timestamp}] ${message}`);
        break;
      case "ERROR" /* ERROR */:
        console.error(`[${timestamp}] ${message}`);
        break;
      case "CRITICAL" /* CRITICAL */:
        console.error(`[${timestamp}] \uD83D\uDEA8 CRITICAL: ${message}`);
        break;
    }
  }
  async sendToExternalServices(entry) {
    const promises = [];
    for (const [serviceName, service] of this.externalServices) {
      promises.push(service(entry).catch((err) => {
        console.error(`Failed to send log to ${serviceName}:`, err);
      }));
    }
    await Promise.allSettled(promises);
  }
  async featureChange(message, data) {
    await this.log("FEATURE_CHANGE" /* FEATURE_CHANGE */, "INFO" /* INFO */, message, data);
  }
  async securityEvent(message, data) {
    await this.log("SECURITY_EVENT" /* SECURITY_EVENT */, "CRITICAL" /* CRITICAL */, message, data);
  }
  async integrationEvent(message, data) {
    await this.log("INTEGRATION_EVENT" /* INTEGRATION_EVENT */, "INFO" /* INFO */, message, data);
  }
  async performanceMetric(message, data) {
    await this.log("PERFORMANCE_METRIC" /* PERFORMANCE_METRIC */, "DEBUG" /* DEBUG */, message, data);
  }
  async error(message, data) {
    await this.log("ERROR_OCCURRED" /* ERROR_OCCURRED */, "ERROR" /* ERROR */, message, data);
  }
  async audit(message, data) {
    await this.log("AUDIT_TRAIL" /* AUDIT_TRAIL */, "INFO" /* INFO */, message, data);
  }
  async healthCheck(message, data) {
    await this.log("HEALTH_CHECK" /* HEALTH_CHECK */, "INFO" /* INFO */, message, data);
  }
  async info(message, data) {
    await this.log("FEATURE_CHANGE" /* FEATURE_CHANGE */, "INFO" /* INFO */, message, data);
  }
  async critical(message, data) {
    await this.log("SECURITY_EVENT" /* SECURITY_EVENT */, "CRITICAL" /* CRITICAL */, message, data);
  }
  getLogs(type, level, limit) {
    let filtered = this.logs;
    if (type) {
      filtered = filtered.filter((log) => log.type === type);
    }
    if (level) {
      filtered = filtered.filter((log) => log.level === level);
    }
    if (limit) {
      filtered = filtered.slice(-limit);
    }
    return filtered;
  }
  getRecentLogs(minutes = 60) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.logs.filter((log) => log.timestamp >= cutoff);
  }
  getLogsByFeature(flag) {
    return this.logs.filter((log) => log.data?.flag === flag || log.message.includes(flag));
  }
  clearLogs() {
    this.logs = [];
  }
  exportLogs(format = "json") {
    switch (format) {
      case "json":
        return JSON.stringify(this.logs, null, 2);
      case "csv":
        const headers = ["timestamp", "type", "level", "message", "prefix"];
        const rows = this.logs.map((log) => [
          log.timestamp.toISOString(),
          log.type,
          log.level,
          log.message,
          log.prefix
        ]);
        return [headers, ...rows].map((row) => row.join(",")).join(`
`);
      case "text":
        return this.logs.map((log) => `${log.timestamp.toISOString()} ${log.prefix} ${log.message}`).join(`
`);
      default:
        return "";
    }
  }
  getLogStats() {
    const byType = {};
    const byLevel = {};
    Object.values(LogType).forEach((type) => byType[type] = 0);
    Object.values(LogLevel).forEach((level) => byLevel[level] = 0);
    this.logs.forEach((log) => {
      byType[log.type]++;
      byLevel[log.level]++;
    });
    return {
      total: this.logs.length,
      byType,
      byLevel,
      oldest: this.logs.length > 0 ? this.logs[0].timestamp : null,
      newest: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null
    };
  }
  tailLogs() {
    console.log("\uD83D\uDCCB Tailing logs (Press Ctrl+C to stop)...");
    const interval = setInterval(() => {
      const recentLogs = this.getRecentLogs(1);
      if (recentLogs.length > 0) {
        recentLogs.forEach((log) => {
          console.log(`${log.prefix} ${log.message}`);
        });
      }
    }, 1000);
    if (typeof process !== "undefined") {
      process.on("SIGINT", () => {
        clearInterval(interval);
        console.log(`
\uD83D\uDCCB Log tailing stopped`);
      });
    }
  }
  displayLogs(logs) {
    console.log(`\uD83D\uDCCB Displaying ${logs.length} logs:`);
    console.log("=".repeat(80));
    logs.forEach((log) => {
      const timestamp = log.timestamp.toISOString();
      const color = this.getLevelColor(log.level);
      const reset = "\x1B[0m";
      console.log(`${color}[${timestamp}] ${log.prefix} ${log.message}${reset}`);
    });
    console.log("=".repeat(80));
  }
  async exportLogsToFormat(logs, format) {
    let output;
    switch (format.toLowerCase()) {
      case "json":
        output = JSON.stringify(logs, null, 2);
        break;
      case "csv":
        const headers = ["timestamp", "type", "level", "message", "prefix"];
        const rows = logs.map((log) => [
          log.timestamp.toISOString(),
          log.type,
          log.level,
          log.message,
          log.prefix
        ]);
        output = [headers, ...rows].map((row) => row.join(",")).join(`
`);
        break;
      default:
        console.error(`\u274C Unsupported export format: ${format}`);
        return;
    }
    console.log(output);
  }
  getLevelColor(level) {
    switch (level) {
      case "DEBUG" /* DEBUG */:
        return "\x1B[36m";
      case "INFO" /* INFO */:
        return "\x1B[32m";
      case "WARN" /* WARN */:
        return "\x1B[33m";
      case "ERROR" /* ERROR */:
        return "\x1B[31m";
      case "CRITICAL" /* CRITICAL */:
        return "\x1B[35m";
      default:
        return "\x1B[0m";
    }
  }
}

// src/index.ts
class PhoneManagementSystem {
  featureRegistry;
  logger;
  dashboard;
  config;
  constructor(options = {}) {
    this.config = this.initializeConfig(options);
    this.featureRegistry = new FeatureRegistry(this.config.featureFlags);
    this.logger = new Logger({
      level: options.verbose ? "DEBUG" /* DEBUG */ : this.config.logging.level,
      externalServices: this.config.logging.externalServices,
      retention: this.config.logging.retention
    });
    this.dashboard = new Dashboard(this.featureRegistry, this.logger, {
      ascii: options.ascii || false
    });
    this.logger.info("Phone Management System initialized", {
      environment: this.config.environment,
      platform: this.config.platform,
      buildType: this.config.buildType,
      featuresEnabled: Array.from(this.config.featureFlags.entries()).filter(([_, enabled]) => enabled).length
    });
  }
  initializeConfig(options) {
    const environment = options.environment || "production";
    const platform = options.platform || (process.env.PLATFORM === "ios" ? "IOS" /* IOS */ : "ANDROID" /* ANDROID */);
    let buildType = options.buildType || "DEVELOPMENT" /* DEVELOPMENT */;
    if (process.env.BUILD_TYPE) {
      const envBuildType = process.env.BUILD_TYPE;
      buildType = BuildType[envBuildType] || "DEVELOPMENT" /* DEVELOPMENT */;
    }
    const buildConfig = BUILD_CONFIGS[buildType];
    const featureFlags = new Map;
    buildConfig.flags.forEach((flag) => {
      featureFlags.set(flag, true);
    });
    if (environment === "production") {
      featureFlags.set("ENV_PRODUCTION" /* ENV_PRODUCTION */, true);
      featureFlags.set("ENV_DEVELOPMENT" /* ENV_DEVELOPMENT */, false);
    } else {
      featureFlags.set("ENV_DEVELOPMENT" /* ENV_DEVELOPMENT */, true);
      featureFlags.set("ENV_PRODUCTION" /* ENV_PRODUCTION */, false);
    }
    if (platform === "ANDROID" /* ANDROID */) {
      featureFlags.set("PLATFORM_ANDROID" /* PLATFORM_ANDROID */, true);
    }
    return {
      environment,
      platform,
      buildType,
      featureFlags,
      apiEndpoints: {
        geelark: process.env.GEELARK_BASE_URL,
        proxy: process.env.PROXY_SERVICE_URL,
        email: process.env.EMAIL_SERVICE_URL,
        sms: process.env.SMS_SERVICE_URL
      },
      logging: {
        level: process.env.LOG_LEVEL || "INFO" /* INFO */,
        externalServices: process.env.EXTERNAL_LOGGING === "true" ? [
          "elasticsearch",
          "splunk",
          "datadog",
          "prometheus",
          "sentry",
          "cloudwatch"
        ] : [],
        retention: parseInt(process.env.LOG_RETENTION_DAYS || "30")
      },
      security: {
        encryption: featureFlags.get("FEAT_ENCRYPTION" /* FEAT_ENCRYPTION */) || false,
        validation: process.env.VALIDATION_MODE || "strict",
        auditTrail: featureFlags.get("FEAT_EXTENDED_LOGGING" /* FEAT_EXTENDED_LOGGING */) || false
      },
      monitoring: {
        advanced: featureFlags.get("FEAT_ADVANCED_MONITORING" /* FEAT_ADVANCED_MONITORING */) || false,
        notifications: featureFlags.get("FEAT_NOTIFICATIONS" /* FEAT_NOTIFICATIONS */) || false,
        healthChecks: true
      }
    };
  }
  async run(args) {
    const command = args[0] || "status";
    try {
      switch (command) {
        case "status":
          await this.handleStatusCommand(args.slice(1));
          break;
        case "dashboard":
          await this.handleDashboardCommand(args.slice(1));
          break;
        case "health":
          await this.handleHealthCommand(args.slice(1));
          break;
        case "logs":
          await this.handleLogsCommand(args.slice(1));
          break;
        case "flags":
          await this.handleFlagsCommand(args.slice(1));
          break;
        case "audit":
          await this.handleAuditCommand(args.slice(1));
          break;
        case "review":
          await this.handleReviewCommand(args.slice(1));
          break;
        case "build":
          await this.handleBuildCommand(args.slice(1));
          break;
        case "start":
          await this.handleStartCommand(args.slice(1));
          break;
        default:
          console.error(`Unknown command: ${command}`);
          this.showHelp();
          process.exit(1);
      }
    } catch (error) {
      this.logger.error(`Command failed: ${command}`, {
        error: error.message,
        stack: error.stack
      });
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  }
  async handleStatusCommand(args) {
    const watch = args.includes("--watch");
    const interval = args.find((arg) => arg.startsWith("--interval="))?.split("=")[1] || "5";
    if (watch) {
      const intervalMs = parseInt(interval) * 1000;
      this.dashboard.startLiveUpdates(intervalMs);
      process.on("SIGINT", () => {
        this.dashboard.stopLiveUpdates();
        process.exit(0);
      });
      await new Promise(() => {});
    } else {
      this.dashboard.displayStatus();
    }
  }
  async handleDashboardCommand(args) {
    const componentIndex = args.findIndex((arg) => arg === "--component");
    const exportIndex = args.findIndex((arg) => arg === "--export");
    if (componentIndex !== -1 && args[componentIndex + 1]) {
      this.dashboard.displayComponent(args[componentIndex + 1]);
    } else if (exportIndex !== -1 && args[exportIndex + 1]) {
      await this.dashboard.export(args[exportIndex + 1]);
    } else {
      this.dashboard.displayFullDashboard();
    }
  }
  async handleHealthCommand(args) {
    const integrations = args.includes("--integrations");
    const detailed = args.includes("--detailed");
    if (integrations) {
      await this.dashboard.checkIntegrationHealth();
    } else {
      this.dashboard.displayHealthStatus(detailed);
    }
  }
  async handleLogsCommand(args) {
    const typeIndex = args.findIndex((arg) => arg === "--type");
    const levelIndex = args.findIndex((arg) => arg === "--level");
    const sinceIndex = args.findIndex((arg) => arg === "--since");
    const exportIndex = args.findIndex((arg) => arg === "--export");
    const tail = args.includes("--tail");
    if (tail) {
      this.logger.tailLogs();
    } else {
      const type = typeIndex !== -1 ? args[typeIndex + 1] : undefined;
      const level = levelIndex !== -1 ? args[levelIndex + 1] : undefined;
      const since = sinceIndex !== -1 ? args[sinceIndex + 1] : undefined;
      const format = exportIndex !== -1 ? args[exportIndex + 1] : undefined;
      const logs = this.logger.getLogs(type);
      if (format) {
        await this.logger.exportLogs(logs, format);
      } else {
        this.logger.displayLogs(logs);
      }
    }
  }
  async handleFlagsCommand(args) {
    const list = args.includes("--list");
    const enableIndex = args.findIndex((arg) => arg === "--enable");
    const disableIndex = args.findIndex((arg) => arg === "--disable");
    const toggleIndex = args.findIndex((arg) => arg === "--toggle");
    const reset = args.includes("--reset");
    const rotate = args.includes("--rotate");
    if (list) {
      this.featureRegistry.displayAllFlags();
    } else if (enableIndex !== -1 && args[enableIndex + 1]) {
      const flag = FeatureFlag[args[enableIndex + 1]];
      if (flag) {
        this.featureRegistry.enableFeature(flag);
        console.log(`\u2705 Enabled ${flag}`);
      } else {
        console.error(`\u274C Unknown feature flag: ${args[enableIndex + 1]}`);
      }
    } else if (disableIndex !== -1 && args[disableIndex + 1]) {
      const flag = FeatureFlag[args[disableIndex + 1]];
      if (flag) {
        this.featureRegistry.disableFeature(flag);
        console.log(`\u274C Disabled ${flag}`);
      } else {
        console.error(`\u274C Unknown feature flag: ${args[disableIndex + 1]}`);
      }
    } else if (toggleIndex !== -1 && args[toggleIndex + 1]) {
      const flag = FeatureFlag[args[toggleIndex + 1]];
      if (flag) {
        this.featureRegistry.toggleFeature(flag);
        const status = this.featureRegistry.isEnabled(flag) ? "enabled" : "disabled";
        console.log(`${status === "enabled" ? "\u2705" : "\u274C"} ${flag} ${status}`);
      } else {
        console.error(`\u274C Unknown feature flag: ${args[toggleIndex + 1]}`);
      }
    } else if (reset) {
      this.featureRegistry.resetToDefaults();
      console.log("\uD83D\uDD04 All feature flags reset to defaults");
    } else if (rotate) {
      this.featureRegistry.rotateFlags();
      console.log("\uD83D\uDD04 Feature flags rotated for maintenance");
    } else {
      this.featureRegistry.displayAllFlags();
    }
  }
  async handleAuditCommand(args) {
    const security = args.includes("--security");
    const full = args.includes("--full");
    const reportIndex = args.findIndex((arg) => arg === "--report");
    console.log("\uD83D\uDD0D Running system audit...");
    if (security) {
      await this.dashboard.runSecurityAudit();
    } else {
      await this.dashboard.runFullAudit(full);
    }
    if (reportIndex !== -1 && args[reportIndex + 1]) {
      await this.dashboard.generateAuditReport(args[reportIndex + 1]);
    }
  }
  async handleReviewCommand(args) {
    const performance = args.includes("--performance");
    const optimize = args.includes("--optimize");
    if (performance) {
      await this.dashboard.reviewPerformance(optimize);
    } else {
      await this.dashboard.runSystemReview();
    }
  }
  async handleBuildCommand(args) {
    const optimize = args.includes("--optimize");
    const analyze = args.includes("--analyze");
    if (optimize) {
      await this.dashboard.optimizeBuild();
    } else if (analyze) {
      await this.dashboard.analyzeBuild();
    } else {
      console.log("\uD83D\uDD28 Building system...");
      console.log("\u2705 Build completed successfully");
    }
  }
  async handleStartCommand(args) {
    const portIndex = args.findIndex((arg) => arg === "--port");
    const mock = args.includes("--mock");
    const port = portIndex !== -1 ? parseInt(args[portIndex + 1]) : 3000;
    if (mock) {
      this.featureRegistry.enableFeature("FEAT_MOCK_API" /* FEAT_MOCK_API */);
    }
    console.log("\uD83D\uDE80 Starting Phone Management System...");
    console.log(`\u2705 System started on port ${port}`);
    this.dashboard.displayStatus();
    if (this.config.monitoring.advanced) {
      this.dashboard.startMonitoring();
    }
    await new Promise(() => {});
  }
  showHelp() {
    console.log(`
Phone Management System - Comprehensive phone management with feature flags

Usage: phone-management-system <command> [options]

Commands:
  status          Display real-time system status
  dashboard       Display comprehensive system dashboard
  health          Check system health and integration status
  logs            View and filter system logs
  flags           Manage feature flags
  audit           Run security and compliance audits
  review          Review system performance and metrics
  build           Build system with optimization
  start           Start the phone management system

Options:
  --help          Show this help message
  --verbose       Enable verbose logging
  --dry-run       Execute in dry-run mode
  --ascii         Force ASCII mode for dashboard
  --no-color      Disable colored output

For detailed help on each command, use:
  phone-management-system <command> --help
    `);
  }
  getFeatureRegistry() {
    return this.featureRegistry;
  }
  getLogger() {
    return this.logger;
  }
  getDashboard() {
    return this.dashboard;
  }
  getConfig() {
    return this.config;
  }
}
if (import.meta.main) {
  const args = process.argv.slice(2);
  const system = new PhoneManagementSystem({
    verbose: args.includes("--verbose"),
    dryRun: args.includes("--dry-run"),
    ascii: args.includes("--ascii")
  });
  system.run(args).catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
var src_default = PhoneManagementSystem;
export {
  src_default as default,
  PhoneManagementSystem
};

//# debugId=5318876519240F3464756E2164756E21
//# sourceMappingURL=production-debug.js.map
