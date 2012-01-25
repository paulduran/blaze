// base64 routines borrowed from http: //ostermiller.org/calc/encode.html
var END_OF_INPUT = -1;

var base64Chars = new Array(
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
    'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
    'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f',
    'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
    'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
    'w', 'x', 'y', 'z', '0', '1', '2', '3',
    '4', '5', '6', '7', '8', '9', '+', '/'
);

var reverseBase64Chars = new Array();
for (var i = 0; i < base64Chars.length; i++) {
    reverseBase64Chars[base64Chars[i]] = i;
}

var base64Str;
var base64Count;
function setBase64Str(str) {
    base64Str = str;
    base64Count = 0;
}
function readBase64() {
    if (!base64Str) return END_OF_INPUT;
    if (base64Count >= base64Str.length) return END_OF_INPUT;
    var c = base64Str.charCodeAt(base64Count) & 0xff;
    base64Count++;
    return c;
}
function encodeBase64(str) {
    setBase64Str(str);
    var result = '';
    var inBuffer = new Array(3);
    var lineCount = 0;
    var done = false;
    while (!done && (inBuffer[0] = readBase64()) != END_OF_INPUT) {
        inBuffer[1] = readBase64();
        inBuffer[2] = readBase64();
        result += (base64Chars[inBuffer[0] >> 2]);
        if (inBuffer[1] != END_OF_INPUT) {
            result += (base64Chars[((inBuffer[0] << 4) & 0x30) | (inBuffer[1] >> 4)]);
            if (inBuffer[2] != END_OF_INPUT) {
                result += (base64Chars[((inBuffer[1] << 2) & 0x3c) | (inBuffer[2] >> 6)]);
                result += (base64Chars[inBuffer[2] & 0x3F]);
            } else {
                result += (base64Chars[((inBuffer[1] << 2) & 0x3c)]);
                result += ('=');
                done = true;
            }
        } else {
            result += (base64Chars[((inBuffer[0] << 4) & 0x30)]);
            result += ('=');
            result += ('=');
            done = true;
        }
        lineCount += 4;
        if (lineCount >= 76) {
            result += ('\n');
            lineCount = 0;
        }
    }
    return result;
}