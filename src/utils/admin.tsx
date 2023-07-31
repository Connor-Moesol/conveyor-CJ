import { Model, Field, FieldData } from '../types'
import { queryToModelName, modelListToModelName } from '../utils/common'

interface IntrospectionTypeInputField {
  name: string
  defaultValue?: string
  type?: IntrospectionType
}
interface IntrospectionTypeField {
  name: string
  type?: IntrospectionType
}
interface IntrospectionType {
  name: string
  kind?: string
  inputFields?: IntrospectionTypeInputField[]
  fields?: IntrospectionTypeField[]
}
interface Introspection {
  __schema: {
    types: IntrospectionType[]
  }
}

export const extractModelsFromIntrospection = (
  introspection: Introspection
) => {
  const models: Record<string, Model> = {}
  // Extract model names and required fields
  introspection.__schema.types.forEach((type: IntrospectionType) => {
    const typeName = type?.name
    if (typeName?.endsWith('InputRequired')) {
      const modelName = typeName.replace('InputRequired', '')
      const fields = {} as Record<string, Field>
      // Get required property for each field
      type.inputFields?.forEach((field) => {
        const required =
          field.defaultValue === null && field.type?.kind === 'NON_NULL'
        fields[field.name] = { required }
      })
      models[modelName] = fields
    }
  })

  // Get related property for each field
  introspection.__schema.types.forEach((type: IntrospectionType) => {
    const typeName = type?.name
    if (models?.[typeName]) {
      type.fields?.forEach((field) => {
        const fieldKind = field.type?.kind
        const fieldName = field.name
        const fields: string[] = []
        switch (fieldKind) {
          case 'OBJECT': {
            const modelName = field.type?.name ?? ''
            models[typeName][fieldName].related = {
              modelName,
              many: false,
              fields,
            }
            break
          }
          case 'LIST': {
            let modelName = modelListToModelName(queryToModelName(fieldName))
            // ** BASIC SMART CHECK IF THE FIELD NAME DOES NOT FOLLOW THE
            // ** CONVENTIONAL WAY OF MODEL LIST NAME: TO BE REMOVED
            // ** ONCE PLURAL FORM IS CHANGED TO BE APPENDED WITH 'LIST'
            if (!models[modelName]) {
              let matches = null
              let prefixAmount = 0.25
              do {
                const prefix = modelName.slice(
                  0,
                  Math.ceil(modelName.length * prefixAmount)
                )
                const pattern = new RegExp(`\\b${prefix}\\w+`, 'g')
                matches = Object.keys(models).join(' ').match(pattern)
                prefixAmount += 0.25
              } while (matches && matches.length > 1 && prefixAmount < 1)
              if (matches?.length === 1) {
                modelName = matches[0]
              } else {
                //throw new Error('Unknown model: ' + modelName)
                delete models[typeName][fieldName]
                break
              }
            }
            models[typeName][fieldName].related = {
              modelName,
              many: true,
              fields,
            }
            break
          }
          default: {
            if (!models[typeName][fieldName] && fieldName !== 'id') {
              models[typeName][fieldName] = { required: false }
            }
          }
        }
      })
    }
  })

  Object.keys(models).forEach((modelName) => {
    Object.keys(models[modelName]).forEach((fieldName) => {
      const related = models[modelName][fieldName].related
      if (related) {
        models[modelName][fieldName].related = {
          ...related,
          fields: Object.keys(models[related.modelName]).includes('name')
            ? ['name', 'id']
            : ['id'],
        }
      }
    })
  })

  // Object.keys(models).forEach((modelName) => {
  //   Object.keys(models[modelName]).forEach((fieldName) => {
  //     const related = models[modelName][fieldName].related
  //     if (related) {
  //       const fieldsData = {} as Record<string, FieldData>
  //       const fieldModel = models[related.modelName]
  //       related.fields.forEach((subFieldName) => {
  //         if (fieldModel[subFieldName].related) {
  //           fieldsData[subFieldName] = {
  //             related: {
  //               modelName: fieldModel[subFieldName].related?.modelName ?? '',
  //               many: fieldModel[subFieldName].related?.many ?? false,
  //               fields: ['name', 'id'],
  //             },
  //           }
  //         }
  //       })
  //       models[modelName][fieldName].related = {
  //         ...related,
  //         fieldsData,
  //       }
  //     }
  //   })
  // })

  return models
}
