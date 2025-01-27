import React, {useCallback, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Drawer} from 'rsuite'

import {BlockProps} from '../atoms/blockList'
import {ChooseEditImage} from '../atoms/chooseEditImage'
import {FieldProps, ListInput} from '../atoms/listInput'
import {TypographicTextArea} from '../atoms/typographicTextArea'
import {ImageEditPanel} from '../panel/imageEditPanel'
import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {isFunctionalUpdate} from '../utility'
import {createDefaultValue, RichTextBlock} from './richTextBlock/richTextBlock'
import {ListicleBlockValue, ListicleItem, RichTextBlockValue} from './types'

export function ListicleBlock({value, onChange, disabled}: BlockProps<ListicleBlockValue>) {
  return (
    <ListInput
      value={value.items}
      onChange={items =>
        onChange(value => ({
          items: isFunctionalUpdate(items) ? items(value.items) : items
        }))
      }
      defaultValue={{image: null, richText: createDefaultValue(), title: ''}}
      disabled={disabled}>
      {props => <ListicleItemElement {...props} />}
    </ListInput>
  )
}

export function ListicleItemElement({value, onChange}: FieldProps<ListicleItem>) {
  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const {image, title, richText} = value

  const {t} = useTranslation()

  const handleRichTextChange = useCallback(
    (richText: React.SetStateAction<RichTextBlockValue>) =>
      onChange(value => ({
        ...value,
        richText: isFunctionalUpdate(richText) ? richText(value.richText) : richText
      })),
    [onChange]
  )

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row'
        }}>
        <div
          style={{
            overflow: 'hidden',
            width: 200,
            height: 150,
            marginRight: 10,
            flexShrink: 0
          }}>
          <ChooseEditImage
            header={''}
            image={image}
            disabled={false}
            openChooseModalOpen={() => setChooseModalOpen(true)}
            openEditModalOpen={() => setEditModalOpen(true)}
            removeImage={() => onChange?.({...value, image: null})}
          />
        </div>
        <div style={{flexGrow: 1}}>
          <TypographicTextArea
            variant="h1"
            placeholder={t('blocks.listicle.title')}
            value={title}
            onChange={e => {
              const title = e.target.value
              onChange(value => ({...value, title}))
            }}
          />

          <RichTextBlock value={richText} onChange={handleRichTextChange} />
        </div>
      </div>

      <Drawer open={isChooseModalOpen} size="sm" onClose={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={image => {
            setChooseModalOpen(false)
            onChange(value => ({...value, image}))
          }}
        />
      </Drawer>
      {image && (
        <Drawer open={isEditModalOpen} size="sm" onClose={() => setEditModalOpen(false)}>
          <ImageEditPanel
            id={image!.id}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        </Drawer>
      )}
    </>
  )
}
