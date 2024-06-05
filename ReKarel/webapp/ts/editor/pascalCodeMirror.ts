import { parser as pascalparser } from "../../js/lezer_pascal";
import {LanguageSupport} from "@codemirror/language"


import {foldNodeProp, foldInside, indentNodeProp} from "@codemirror/language"
import {styleTags, tags as t} from "@lezer/highlight"
import {LRLanguage, continuedIndent, delimitedIndent} from "@codemirror/language"

let pascalWithContext = pascalparser.configure({
    props: [
        styleTags({
            StartProgram: t.keyword,
            EndProgram: t.keyword,
            Define: t.definitionKeyword,
            Prototipo: t.definitionKeyword,
            As: t.controlKeyword,
            StartExecution: t.moduleKeyword,
            EndExecution: t.moduleKeyword,
            ProgramClass: t.className,
            ProgramMain: t.function(t.variableName),
            Comment: t.comment,
            obr: t.bracket,
            cbr: t.bracket,
            Identifier: t.variableName,
            Number: t.integer,
            While: t.controlKeyword,
            If: t.controlKeyword,
            Else: t.controlKeyword,
            Iterate: t.controlKeyword,
            Then: t.controlKeyword,
            Do: t.controlKeyword,
            Times: t.controlKeyword,
            Begin: t.brace,
            End: t.brace,
            BoolFunc: t.atom,
            Ifzero: t.atom,
            And : t.operator,
            Not : t.operator,
            Or : t.operator,
            BlockComment:t.blockComment,
            BlockComment2:t.blockComment,
            BuiltIn: t.constant(t.variableName),
            Succ: t.operator,
            Pred: t.operator
        }),
        indentNodeProp.add({
            Function: continuedIndent({}),
            Script: continuedIndent({}),
            Block: delimitedIndent({closing:"fin"}),
            Execution: delimitedIndent({closing:"termina-ejecucion"}),
          }),           
        foldNodeProp.add({
            Block: foldInside,
            Execution : foldInside
        }),
    ]
}
)

const pascalLanguage = LRLanguage.define({
    parser: pascalWithContext,
    languageData: {
      commentTokens: { 
        block: {
          open:"{",
          close:"}"
        }
      },
      // indentOnInput: /^\s*fin$/
    }
  })


  import {completeFromList} from "@codemirror/autocomplete"
import { BuiltIn, Prototipo } from "../../js/lezer_pascal.terms";
import { Define } from "../../js/lezer_java.terms";

  const pascalCompletion = pascalLanguage.data.of({
    autocomplete: completeFromList([
        {label: "define-nuevo-prototipo", type: "keyword"},
        {label: "define-nueva-instruccion", type: "keyword"},
        {label: "salir-de-instruccion", type: "keyword"},
        {label: "si", type: "keyword"},
        {label: "entonces", type: "keyword"},
        {label: "sino", type: "keyword"},
        {label: "si-no", type: "keyword"},
        {label: "repetir", type: "keyword"},
        {label: "veces", type: "keyword"},
        {label: "mientras", type: "keyword"},
        {label: "hacer", type: "keyword"},
        {label: "sucede", type: "function"},
        {label: "precede", type: "function"},
        {label: "avanza", type: "function"},
        {label: "gira-izquierda", type: "function"},
        {label: "apagate", type: "function"},
        {label: "deja-zumbador", type: "function"},
        {label: "inicio", type: "keyword"},
        {label: "fin", type: "keyword"},
    ])
  })

  function kpascal() {
    return new LanguageSupport(pascalLanguage , [pascalCompletion])
  }
  export { pascalLanguage, pascalCompletion, kpascal}
