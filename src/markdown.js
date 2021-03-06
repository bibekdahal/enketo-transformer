/**
 * Transforms XForm label and hint textnode content with a subset of Markdown into HTML
 * 
 * Supported:
 * - _, __, *, **, [](), #, ##, ###, ####, #####, 
 * - span tags and html-encoded span tags,
 * - single-level unordered markdown lists and single-level ordered markdown lists
 * - newline characters
 * 
 * Also HTML encodes any unsupported HTML tags for safe use inside web-based clients
 * 
 * @param  {string} text text content of a textnode
 * @return {string}      transformed text content of a textnode
 */
function markdownToHtml( text ) {
    // note: in JS $ matches end of line as well as end of string, and ^ both beginning of line and string
    const html = text
        // html encoding of < because libXMLJs Element.text() converts html entities
        .replace( /</gm, '&lt;' )
        // html encoding of < because libXMLJs Element.text() converts html entities
        .replace( />/gm, '&gt;' )
        // span
        .replace( /&lt;\s?span([^/\n]*)&gt;((?:(?!&lt;\/).)+)&lt;\/\s?span\s?&gt;/gm, _createSpan )
        // "\" will be used as escape character for *, _
        .replace( /&/gm, '&amp;' )
        .replace( /\\\\/gm, '&92;' )
        .replace( /\\\*/gm, '&42;' )
        .replace( /\\_/gm, '&95;' )
        .replace( /\\#/gm, '&35;' )
        // strong
        .replace( /__(.*?)__/gm, '<strong>$1</strong>' )
        .replace( /\*\*(.*?)\*\*/gm, '<strong>$1</strong>' )
        // emphasis
        .replace( /_([^\s][^_\n]*)_/gm, '<em>$1</em>' )
        .replace( /\*([^\s][^*\n]*)\*/gm, '<em>$1</em>' )
        // links
        .replace( /\[([^\]]*)\]\(([^)]+)\)/gm, '<a href="$2" target="_blank">$1</a>' )
        // headers
        .replace( /^\s*(#{1,6})\s?([^#][^\n]*)(\n|$)/gm, _createHeader )
        // unordered lists 
        .replace( /(\n(\*|\+|-) (.*))+$/gm, _createUnorderedList )
        // ordered lists 
        .replace( /(\n([0-9]+\.) (.*))+$/gm, _createOrderedList )
        // reverting escape of special characters
        .replace( /&35;/gm, '#' )
        .replace( /&95;/gm, '_' )
        .replace( /&92;/gm, '\\' )
        .replace( /&42;/gm, '*' )
        .replace( /&amp;/gm, '&' )
        // paragraphs
        .replace( /([^\n]+)\n{2,}/gm, _createParagraph )
        // any remaining newline characters
        .replace( /([^\n]+)\n/gm, '$1<br>' );

    return html;
}

function _createHeader( match, hashtags, content ) {
    const level = hashtags.length;
    return `<h${level}>${content.replace( /#+$/, '' )}</h${level}>`;
}

function _createUnorderedList( match ) {
    const items = match.replace( /\n?(\*|\+|-)(.*)/gm, _createItem );
    return `<ul>${items}</ul>`;
}

function _createOrderedList( match ) {
    const items = match.replace( /\n?([0-9]+\.)(.*)/gm, _createItem );
    return `<ol>${items}</ol>`;
}

function _createItem( match, bullet, content ) {
    return `<li>${content.trim()}</li>`;
}

function _createParagraph( match, line ) {
    const trimmed = line.trim();
    if ( /^<\/?(ul|ol|li|h|p|bl)/i.test( trimmed ) ) {
        return line;
    }
    return `<p>${trimmed}</p>`;
}

function _createSpan( match, attributes, content ) {
    const sanitizedAttributes = _sanitizeAttributes( attributes );
    return `<span${sanitizedAttributes}>${content}</span>`;
}

function _sanitizeAttributes( attributes ) {
    const styleMatches = attributes.match( /( style=(["'])[^"']*\2)/ );
    const style = ( styleMatches && styleMatches.length ) ? styleMatches[ 0 ] : '';
    return style;
}

module.exports = {
    toHtml: markdownToHtml
};