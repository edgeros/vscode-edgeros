/*
 * @Author: FuWenHao  
 * @Date: 2021-03-22 16:03:29 
 * @Last Modified by: FuWenHao 
 * @Last Modified time: 2021-03-22 17:20:01
 */
interface StringArray {
    [index: string]:
    {
        detail: string,
        commitCharacters: string[],
        documentation: string
        children?: {
            [index: string]: {
                detail: string,
                commitCharacters: string[],
                documentation: string,
                insertText?: string
            }
        },
        insertText?: string
    };
}

export const componentItems: StringArray = {
    fuwenhao: {
        detail: 'fuwenhao',
        commitCharacters: ['.'],
        documentation: 'this is EdgerOs Api fuwenhao123',
        children: {
            abc: {
                detail: 'fuwenhao',
                commitCharacters: ['.'],
                documentation: 'this is EdgerOs Api fuwenhao123',
                insertText: '你猜猜你想干啥'
            },
            def: {
                detail: 'fuwenhao',
                commitCharacters: ['.'],
                documentation: 'this is EdgerOs Api fuwenhao123',
                insertText: 'def(${1:age},${2:sex})'
            },
        }
    },
    edgerOS: {
        detail: 'edgerOS',
        commitCharacters: ['.'],
        documentation: 'this is EdgerOs Api fuwenhao'
    }
};

