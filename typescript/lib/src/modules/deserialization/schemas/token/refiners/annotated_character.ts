import * as p_ from 'pareto-core/refiner'
import * as p_schema from 'pareto-core/schema'
import * as p_t from 'pareto-core/transformer'
import p_unreachable_code_path from 'pareto-core/transformer/specials/unreachable_code_path'
import p_variables from 'pareto-core/transformer/specials/variables'
import p_text_from_list from 'pareto-core/transformer/specials/text_from_list'

//schemas
import type * as s_in from "../../annotated_characters/schema.js"
import type * as s_out from "../schema.js"
import type * as s_function from "../../parse_tree_deserialization/schema.js"
import type * as s_location from "../../location/schema.js"

import type * as s_temp_location from "../../location/schema.js"

//dependencies



const create_range: p_.Production_Without_Error_With_Parameter<
    s_temp_location.Range,
    s_in.Annotated_Character,
    s_location.Location,
    {
        'start character': s_in.Annotated_Character
    }
> = (
    iterator,
    $p
): s_temp_location.Range => ({
    'start': $p['start character'].location,
    'end': iterator.peek(
        ($) => $,
        ($) => $.location,
    )
})


export const Whitespace: p_.Production_Without_Error<
    s_out.Whitespace,
    s_in.Annotated_Character,
    s_location.Location
> = (
    iterator,
): s_out.Whitespace => {

        const is_whitespace_character = ($: s_in.Annotated_Character) => {
            switch ($.code) {
                case 0x09: // \t
                    return true
                case 0x0A: // \n
                    return true
                case 0x0D: // \r
                    return true
                case 0x20: // space
                    return true
                case 0x2C: // ,
                    return true
                default:
                    return false
            }
        }

        return iterator.peek(
            () => p_.literal.not_set(),
            ($) => {
                if (!is_whitespace_character($)) {
                    return p_.literal.not_set()
                } else {
                    const start_character = $
                    return p_.literal.set({
                        'value': p_text_from_list<number>(
                            iterator.build_list({
                                has_more_items: ($) => is_whitespace_character($),
                                handle: () => iterator.consume(
                                    () => p_unreachable_code_path("we checked that there is a next character, so this should never happen"),
                                    ($) => $.code,
                                ),
                                on_no_progression: () => p_unreachable_code_path("'handle' directly consumes the next character, so this should never happen"),
                            }),
                            ($) => $
                        ),
                        'range': create_range(
                            iterator,
                            {
                                'start character': start_character
                            }
                        ),
                    })
                }

            },
        )
    }

export const Trivia: p_.Production<
    s_out.Trivia,
    s_function.Lexer_Error,
    s_in.Annotated_Character,
    s_location.Location
> = (iterator, abort): s_out.Trivia => ({
    'leading whitespace': Whitespace(iterator),
    'comments': iterator.build_list({
        has_more_items: (current) => {
            // slash followed by either slash or asterisk
            return current.code === 0x2F
                && iterator.peek_ahead(
                    1,
                    () => false,
                    ($) => $.code === 0x2F || $.code === 0x2A, // slash or asterisk
                )
        },
        handle: () => {
            return iterator.consume( // discard the first slash
                () => p_unreachable_code_path("has_more_items -> true"),
                (first_slash) => iterator.peek(
                    () => p_unreachable_code_path("has_more_items -> true"),
                    ($) => {
                        switch ($.code) {
                            case 0x2F: // /
                                return iterator.consume(// discard the second /
                                    () => p_unreachable_code_path("has_more_items -> true"),
                                    () => ({
                                        'type': ['line', null],
                                        'content': p_text_from_list(
                                            iterator.build_list({
                                                has_more_items: ($) => $.code !== 0x0A && $.code !== 0x0D, // not a line feed or carriage return
                                                handle: () => iterator.consume(
                                                    () => p_unreachable_code_path("has_more_items -> true"),
                                                    ($) => $.code,
                                                ),
                                                on_no_progression: () => p_unreachable_code_path("'handle' directly consumes the next character, so this should never happen"),
                                            }),
                                            ($) => $
                                        ),
                                        'range': create_range(iterator, { 'start character': first_slash }),
                                        'trailing whitespace': Whitespace(iterator)
                                    }),

                                )
                            case 0x2A: return iterator.consume(// discard the asterisk
                                () => p_unreachable_code_path("has_more_items -> true"),
                                () => ({
                                    'type': ['block', null],
                                    'content': p_variables(() => {
                                        const $p_temp_content = p_text_from_list(
                                            iterator.build_list({
                                                has_more_items: ($) => {
                                                    // not an asterisk followed by a solidus (end of block comment)
                                                    return $.code !== 0x2A
                                                        || iterator.peek_ahead(
                                                            1,
                                                            () => true, // the asterisk needs to be processed, so, yes, there are more items
                                                            ($) => $.code !== 0x2F, // not a solidus
                                                        )
                                                },
                                                handle: () => iterator.consume(
                                                    () => p_unreachable_code_path("has_more_items -> true"),
                                                    ($) => $.code,
                                                ),
                                                on_no_progression: () => p_unreachable_code_path("'handle' directly consumes the next character, so this should never happen"),
                                            }),
                                            ($) => $
                                        )
                                        iterator.consume( // discard the asterisk
                                            ($) => abort({
                                                'expected': ['block comment termination', null],
                                                'range': {
                                                    'start': $,
                                                    'end': $,
                                                }
                                            }),
                                            ($) => $.code === 0x2A
                                                ? null
                                                : abort({
                                                    'expected': ['block comment termination', null],
                                                    'range': {
                                                        'start': $.location,
                                                        'end': $.location,
                                                    }
                                                }),
                                        )
                                        return iterator.consume( // discard the solidus
                                            ($) => abort({
                                                'expected': ['block comment termination', null],
                                                'range': {
                                                    'start': $,
                                                    'end': $,
                                                }
                                            }),
                                            ($) => $.code === 0x2F
                                                ? $p_temp_content
                                                : abort({
                                                    'expected': ['block comment termination', null],
                                                    'range': {
                                                        'start': $.location,
                                                        'end': $.location,
                                                    }
                                                }),
                                        )

                                    }
                                    ),
                                    'range': create_range(iterator, { 'start character': first_slash }),
                                    'trailing whitespace': Whitespace(iterator)
                                }),

                            )
                            default: return p_unreachable_code_path("we checked in has_more_items that the next character is either a * or a /, so this should never happen")
                        }
                    },
                ),
            )
        },
        on_no_progression: () => p_unreachable_code_path("'handle' directly consumes the next character, so this should never happen"),
    }),
})

export const Delimited_Text: p_.Production_With_Parameter<
    string,
    s_function.Lexer_Error,
    s_in.Annotated_Character,
    s_location.Location,
    {
        'allow newlines': boolean,
        'end character': number,
        'start character': s_in.Annotated_Character
    }
> = (iterator, abort, $p) => {
    const $p_content = p_text_from_list(
        iterator.build_list_with_segments({
            has_more_items: ($) => $.code !== $p['end character'],
            handle: () => iterator.consume(
                () => p_unreachable_code_path("has_more_items -> true"),
                ($) => {
                    const Character = {
                        backspace: 0x08,            // \b
                        form_feed: 0x0C,            // \f
                        tab: 0x09,                  // \t
                        line_feed: 0x0A,            // \n
                        carriage_return: 0x0D,      // \r
                        quotation_mark: 0x22,       // "
                        backtick: 0x60,             // `
                        apostrophe: 0x27,           // '
                        reverse_solidus: 0x5C,      // \
                        solidus: 0x2F,              // /
                        a: 0x61,                    // a
                        b: 0x62,                    // b
                        f: 0x66,                    // f
                        n: 0x6E,                    // n
                        r: 0x72,                    // r
                        t: 0x74,                    // t
                        u: 0x75,                    // u
                        A: 0x41,                    // A
                        F: 0x46,                    // F

                    }
                    switch ($.code) {
                        case Character.line_feed: return $p['allow newlines']
                            ? p_.literal.list([$.code])
                            : abort({
                                'expected': ['no end of line in text', null],
                                'range': create_range(iterator, { 'start character': $p['start character'] }),
                            })
                        case Character.carriage_return: return $p['allow newlines']
                            ? p_.literal.list([$.code])
                            : abort({
                                'expected': ['no end of line in text', null],
                                'range': create_range(iterator, { 'start character': $p['start character'] }),
                            })
                        case Character.reverse_solidus: return iterator.consume(
                            ($) => abort({
                                'range': create_range(iterator, { 'start character': $p['start character'] }),
                                'expected': ['escape character', { 'found': p_.literal.not_set() }]
                            }),
                            ($) => {
                                switch ($.code) {
                                    case Character.quotation_mark: return p_.literal.list([Character.quotation_mark])
                                    case Character.apostrophe: return p_.literal.list([Character.apostrophe])
                                    case Character.backtick: return p_.literal.list([Character.backtick])
                                    case Character.reverse_solidus: return p_.literal.list([Character.reverse_solidus])
                                    case Character.solidus: return p_.literal.list([Character.solidus])

                                    case Character.b: return p_.literal.list([Character.backspace])
                                    case Character.f: return p_.literal.list([Character.form_feed])
                                    case Character.n: return p_.literal.list([Character.line_feed])
                                    case Character.r: return p_.literal.list([Character.carriage_return])
                                    case Character.t: return p_.literal.list([Character.tab])
                                    case Character.u: {
                                        const unicode_escape_error = (found: p_schema.Optional_Value<number>): never => abort({
                                            'range': create_range(iterator, { 'start character': $p['start character'] }),
                                            'expected': ['unicode character', { 'found': found }]
                                        })
                                        const hexadecimal_digit = (): number => iterator.consume(
                                            () => unicode_escape_error(p_.literal.not_set()),
                                            ($) => {
                                                if ($.code >= 0x30 && $.code <= 0x39) {
                                                    return $.code - 0x30
                                                } else if ($.code >= 0x41 && $.code <= 0x46) {
                                                    return $.code - 0x41 + 10
                                                } else if ($.code >= 0x61 && $.code <= 0x66) {
                                                    return $.code - 0x61 + 10
                                                } else {
                                                    return unicode_escape_error(p_.literal.set($.code))
                                                }
                                            },
                                        )
                                        // Four hexadecimal digits represent one UTF-16 code unit.
                                        const code_unit = (): number => {
                                            const first = hexadecimal_digit()
                                            const second = hexadecimal_digit()
                                            const third = hexadecimal_digit()
                                            const fourth = hexadecimal_digit()
                                            return ((first * 16 + second) * 16 + third) * 16 + fourth
                                        }
                                        const is_high_surrogate = ($: number): boolean => $ >= 0xD800 && $ <= 0xDBFF
                                        const is_low_surrogate = ($: number): boolean => $ >= 0xDC00 && $ <= 0xDFFF
                                        const lone_surrogate = (found: number): never => abort({
                                            'range': create_range(iterator, { 'start character': $p['start character'] }),
                                            'expected': ['surrogate pair', { 'found': found }]
                                        })
                                        const is_character = (offset: number, character: number): boolean => iterator.peek_ahead(
                                            offset,
                                            () => false,
                                            ($) => $.code === character,
                                        )
                                        const unit = code_unit()
                                        if (is_low_surrogate(unit)) {
                                            return lone_surrogate(unit)
                                        }
                                        if (!is_high_surrogate(unit)) {
                                            return p_.literal.list([unit])
                                        }
                                        if (!is_character(0, Character.reverse_solidus) || !is_character(1, Character.u)) {
                                            return lone_surrogate(unit)
                                        }
                                        iterator.consume(() => p_unreachable_code_path("peeked: \\"), () => null)
                                        iterator.consume(() => p_unreachable_code_path("peeked: u"), () => null)
                                        const low = code_unit()
                                        return is_low_surrogate(low)
                                            ? p_.literal.list([unit, low])
                                            : lone_surrogate(unit)
                                    }
                                    default: return abort({
                                        'range': create_range(iterator, { 'start character': $p['start character'] }),
                                        'expected': ['escape character', {
                                            'found': p_.literal.set($.code)
                                        }]
                                    })
                                }
                            },
                        )
                        default: return p_.literal.list([$.code])
                    }
                },
            ),
            on_no_progression: () => p_unreachable_code_path("'handle' directly consumes the next character, so this should never happen"),
        }),
        ($) => $
    )
    iterator.consume( //discard the end character
        () => abort({
            'expected': ['text termination', null],
            'range': create_range(iterator, { 'start character': $p['start character'] }),
        }),
        () => null
    )
    return $p_content
}

export const Tokenizer_Result: p_.Production_With_Parameter<
    s_out.Tokenizer_Result,
    s_function.Lexer_Error,
    s_in.Annotated_Character,
    s_location.Location,
    {
        'end info': s_location.Location
    }
> = (
    iterator,
    abort,
    $p
) => ({
    'leading trivia': Trivia(iterator, abort),
    'tokens': iterator.build_list({
        has_more_items: ($) => true,
        handle: () => {
            const $p_start = iterator.peek(
                () => p_unreachable_code_path("has_more_items -> true"),
                ($) => $,
            )
            return ({
                'start': $p_start.location,
                'type': iterator.peek(
                    () => p_unreachable_code_path("has_more_items -> true"),
                    ($) => {

                        const Character = {

                            open_angle_bracket: 0x3C, // <
                            open_brace: 0x7B,           // {
                            open_bracket: 0x5B,         // [
                            open_paren: 0x28,          // (

                            close_angle_bracket: 0x3E, // >
                            close_brace: 0x7D,          // }
                            close_bracket: 0x5D,        // ]
                            close_paren: 0x29,         // )

                            apostrophe: 0x27,          // '
                            asterisk: 0x2A,            // *
                            at: 0x40,                  // @
                            backtick: 0x60,            // `
                            bang: 0x21,
                            colon: 0x3A,                // :
                            pipe: 0x7C,                // |
                            quotation_mark: 0x22,       // "
                            slash: 0x2F,               // /
                            underscore: 0x5F,           // _
                            tilde: 0x7E,               // ~
                            hash: 0x23,                // #

                            space: 0x20,               // space
                            tab: 0x09,                 // \t

                        }
                        switch ($.code) {
                            case Character.open_brace: return iterator.consume(
                                () => p_unreachable_code_path("peeked"),
                                ($) => ['{', null],
                            )
                            case Character.open_bracket: return iterator.consume(
                                () => p_unreachable_code_path("peeked"),
                                ($) => ['[', null],
                            )
                            case Character.open_angle_bracket: return iterator.consume(
                                () => p_unreachable_code_path("peeked"),
                                ($) => ['<', null],
                            )
                            case Character.open_paren: return iterator.consume(
                                () => p_unreachable_code_path("peeked"),
                                ($) => ['(', null],
                            )
                            case Character.close_brace: return iterator.consume(
                                () => p_unreachable_code_path("peeked"),
                                ($) => ['}', null],
                            )
                            case Character.close_bracket: return iterator.consume(
                                () => p_unreachable_code_path("peeked"),
                                ($) => [']', null],
                            )
                            case Character.close_angle_bracket: return iterator.consume(
                                () => p_unreachable_code_path("peeked"),
                                ($) => ['>', null],
                            )
                            case Character.close_paren: return iterator.consume(
                                () => p_unreachable_code_path("peeked"),
                                ($) => [')', null],
                            )


                            //individuals
                            case Character.hash: return iterator.consume(
                                () => p_unreachable_code_path("peeked"),
                                ($) => ['#', null] // missing data token
                            )
                            case Character.pipe: return iterator.consume(
                                () => p_unreachable_code_path("peeked"),
                                ($) => ['|', null] // state value token
                            )
                            case Character.underscore: return iterator.consume(
                                () => p_unreachable_code_path("peeked"),
                                ($) => ['_', null] // unset value token
                            )
                            case Character.tilde: return iterator.consume(
                                () => p_unreachable_code_path("peeked"),
                                ($) => ['~', null] // unset value token
                            )
                            case Character.asterisk: return iterator.consume(
                                () => p_unreachable_code_path("peeked"),
                                ($) => ['*', null] // set value token
                            )
                            case Character.at: return iterator.consume(
                                () => p_unreachable_code_path("peeked"),
                                ($) => ['@', null] // include token
                            )
                            case Character.bang: return iterator.consume(
                                () => p_unreachable_code_path("peeked"),
                                ($) => ['!', null] // header token
                            )
                            case Character.colon: return iterator.consume(
                                () => p_unreachable_code_path("peeked"),
                                ($) => [':', null] // structural token
                            )
                            case Character.quotation_mark: return iterator.consume(
                                () => p_unreachable_code_path("peeked"),
                                ($) => ['text', {
                                    'value': Delimited_Text(
                                        iterator,
                                        abort,
                                        {
                                            'start character': $,
                                            'end character': Character.quotation_mark,
                                            'allow newlines': true,
                                        }
                                    ),
                                    'type': ['quoted', null],
                                }],
                            )
                            case Character.backtick: return iterator.consume(
                                () => p_unreachable_code_path("peeked"),
                                ($) => ['text', {
                                    'value': Delimited_Text(
                                        iterator,
                                        abort,
                                        {
                                            'start character': $,
                                            'end character': Character.backtick,
                                            'allow newlines': true,
                                        }
                                    ),
                                    'type': ['backticked', null],
                                }],
                            )
                            case Character.apostrophe: return iterator.consume(
                                () => p_unreachable_code_path("peeked"),
                                ($) => ['text', {
                                    'value': Delimited_Text(
                                        iterator,
                                        abort,
                                        {
                                            'start character': $,
                                            'end character': Character.apostrophe,
                                            'allow newlines': true,
                                        }
                                    ),
                                    'type': ['apostrophed', null],
                                }],
                            )

                            default: return ['text', {
                                'type': ['undelimited', null],
                                'value': p_text_from_list(

                                    iterator.build_list({
                                        has_more_items: ($) => {
                                            const WhitespaceChars = {
                                                tab: 0x09,                  // \t
                                                line_feed: 0x0A,            // \n
                                                carriage_return: 0x0D,      // \r
                                                space: 0x20,                //
                                                comma: 0x2C,                // ,
                                            }
                                            return $.code !== Character.open_brace &&
                                                $.code !== Character.close_brace &&
                                                $.code !== Character.open_bracket &&
                                                $.code !== Character.close_bracket &&
                                                $.code !== Character.open_angle_bracket &&
                                                $.code !== Character.close_angle_bracket &&
                                                $.code !== Character.open_paren &&
                                                $.code !== Character.close_paren &&
                                                $.code !== Character.apostrophe &&
                                                $.code !== Character.asterisk &&
                                                $.code !== Character.at &&
                                                $.code !== Character.backtick &&
                                                $.code !== Character.bang &&
                                                $.code !== Character.colon &&
                                                $.code !== Character.pipe &&
                                                $.code !== Character.quotation_mark &&
                                                $.code !== Character.slash &&
                                                $.code !== Character.tilde &&
                                                $.code !== WhitespaceChars.comma &&
                                                $.code !== WhitespaceChars.space &&
                                                $.code !== WhitespaceChars.tab &&
                                                $.code !== WhitespaceChars.line_feed &&
                                                $.code !== WhitespaceChars.carriage_return
                                        },
                                        handle: () => iterator.consume(
                                            () => p_unreachable_code_path("has_more_items -> true"),
                                            ($) => $.code,
                                        ),
                                        on_no_progression: () => p_unreachable_code_path("handle consumes directly"),
                                    }),
                                    ($) => $
                                )
                            }]
                        }


                    },
                ),
                'end': create_range(iterator, { 'start character': $p_start }).end,
                'trailing trivia': Trivia(iterator, abort),
            })
        },
        on_no_progression: ($) => p_unreachable_code_path("handle is expected to always consume at least one character, so this should never happen, character:" + $.code + "("+ $.location.relative.line + ":" + $.location.relative.column + ")"),
    }),
    'end': $p['end info']
})