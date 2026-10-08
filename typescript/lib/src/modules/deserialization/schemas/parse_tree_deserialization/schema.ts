
import * as p_di from 'pareto-core/schema'

import * as i_imports_token from "../token/schema.js"

import * as i_imports_location from "../location/schema.js"

export namespace Error_ {
    
    export namespace type_ {
        
        export type lexer = Lexer_Error_
        
        export type parser = Parser_Error_
        
    }
    
    export type type_ = 
        | readonly ['lexer', type_.lexer]
        | readonly ['parser', type_.parser]
    
}

export type Error_ = {
    readonly 'type': Error_.type_
}

export namespace Lexer_Error_ {
    
    export type range = i_imports_location.Range
    
    export namespace expected {
        
        export type no_end_of_line_in_text = null
        
        export namespace escape_character {
            
            export namespace found {
                
                export type O = number
                
            }
            
            export type found = p_di.Optional_Value<found.O>
            
        }
        
        export type escape_character = {
            readonly 'found': escape_character.found
        }
        
        export namespace unicode_character {
            
            export namespace found {
                
                export type O = number
                
            }
            
            export type found = p_di.Optional_Value<found.O>
            
        }
        
        export type unicode_character = {
            readonly 'found': unicode_character.found
        }

        export type surrogate_pair = {
            readonly 'found': number
        }
        
        export type block_comment_termination = null
        
        export type text_termination = null
        
    }
    
    export type expected = 
        | readonly ['no end of line in text', expected.no_end_of_line_in_text]
        | readonly ['escape character', expected.escape_character]
        | readonly ['unicode character', expected.unicode_character]
        | readonly ['surrogate pair', expected.surrogate_pair]
        | readonly ['block comment termination', expected.block_comment_termination]
        | readonly ['text termination', expected.text_termination]
    
}

export type Lexer_Error_ = {
    readonly 'range': Lexer_Error_.range
    readonly 'expected': Lexer_Error_.expected
}

export namespace Parser_Error_ {
    
    export namespace expected {
        
        export type L = Expected_
        
    }
    
    export type expected = p_di.List<expected.L>
    
    export namespace cause {
        
        export namespace missing_token {
            
            export type end = i_imports_location.Location
            
        }
        
        export type missing_token = {
            readonly 'end': missing_token.end
        }
        
        export namespace unexpected_token {
            
            export type found = i_imports_token.Annotated_Token
            
        }
        
        export type unexpected_token = {
            readonly 'found': unexpected_token.found
        }
        
    }
    
    export type cause = 
        | readonly ['missing token', cause.missing_token]
        | readonly ['unexpected token', cause.unexpected_token]
    
}

export type Parser_Error_ = {
    readonly 'expected': Parser_Error_.expected
    readonly 'cause': Parser_Error_.cause
}

export namespace Expected_ {
    
    export type a_text_value = null
    
    export type any_value = null
    
    export type $ex_ = null
    
    export type $gt_ = null
    
    export type $cc_ = null
    
    export type $at_ = null
    
    export type $cm_ = null
    
    export type $cl_ = null
    
    export type $pc_ = null
    
    export type $bc_ = null
    
    export type $ha_ = null
    
}

export type Expected_ = 
    | readonly ['a text value', Expected_.a_text_value]
    | readonly ['any value', Expected_.any_value]
    | readonly ['!', Expected_.$ex_]
    | readonly ['>', Expected_.$gt_]
    | readonly ['}', Expected_.$cc_]
    | readonly ['@', Expected_.$at_]
    | readonly [',', Expected_.$cm_]
    | readonly [':', Expected_.$cl_]
    | readonly [')', Expected_.$pc_]
    | readonly [']', Expected_.$bc_]
    | readonly ['#', Expected_.$ha_]

export namespace Parameters_ {
    
    export type tab_size = number
    
}

export type Parameters_ = {
    readonly 'tab size': Parameters_.tab_size
}

export type { 
    Error_ as Error, 
    Lexer_Error_ as Lexer_Error, 
    Parser_Error_ as Parser_Error, 
    Expected_ as Expected, 
    Parameters_ as Parameters, 
}
