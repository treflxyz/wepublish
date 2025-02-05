import React, {useCallback, useEffect, useRef, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdEdit} from 'react-icons/md'
import {Drawer, IconButton, Input} from 'rsuite'

import {BlockProps} from '../atoms/blockList'
import {ChooseEditImage} from '../atoms/chooseEditImage'
import {ImageEditPanel} from '../panel/imageEditPanel'
import {ImageSelectPanel} from '../panel/imageSelectPanel'
import {LinkPageBreakEditPanel} from '../panel/linkPageBreakEditPanel'
import {isFunctionalUpdate} from '../utility'
import {createDefaultValue, RichTextBlock} from './richTextBlock/richTextBlock'
import {LinkPageBreakBlockValue, RichTextBlockValue} from './types'

export type LinkPageBreakBlockProps = BlockProps<LinkPageBreakBlockValue>

export function LinkPageBreakBlock({
  value,
  onChange,
  autofocus,
  disabled
}: LinkPageBreakBlockProps) {
  const {text, richText, image} = value
  const focusRef = useRef<HTMLTextAreaElement>(null)
  const focusInputRef = useRef<HTMLInputElement>(null)

  const {t} = useTranslation()

  useEffect(() => {
    if (autofocus) focusRef.current?.focus()
  }, [])

  const handleRichTextChange = useCallback(
    (richText: React.SetStateAction<RichTextBlockValue>) =>
      onChange(value => ({
        ...value,
        richText: isFunctionalUpdate(richText) ? richText(value.richText) : richText
      })),
    [onChange]
  )

  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [isEditPanelOpen, setEditPanelOpen] = useState(false)

  return (
    <>
      <div style={{position: 'relative', width: '100%'}}>
        <div style={{position: 'absolute', zIndex: 1, height: '100%', right: 0}}>
          <IconButton size="lg" icon={<MdEdit />} onClick={() => setEditPanelOpen(true)} />
        </div>
      </div>
      <div style={{display: 'flex', flexFlow: 'row wrap', marginTop: 50}}>
        <div style={{flex: '1 0 25%', alignSelf: 'center', marginBottom: '10px'}}>
          <ChooseEditImage
            header={''}
            image={image}
            disabled={false}
            openChooseModalOpen={() => setChooseModalOpen(true)}
            openEditModalOpen={() => setEditModalOpen(true)}
            removeImage={() => onChange(value => ({...value, image: undefined}))}
          />
        </div>
        <div style={{flex: '1 0 70%'}}>
          <Input
            ref={focusInputRef}
            placeholder={t('blocks.linkPageBreak.title')}
            style={{fontSize: '24px', marginBottom: 20}}
            value={text}
            disabled={disabled}
            onChange={text => onChange({...value, text})}
          />

          <RichTextBlock value={richText || createDefaultValue()} onChange={handleRichTextChange} />
        </div>
      </div>
      <Drawer open={isChooseModalOpen} size="sm" onClose={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={image => {
            setChooseModalOpen(false)
            onChange(value => ({...value, image, imageID: image.id}))
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
      <Drawer open={isEditPanelOpen} size="sm" onClose={() => setEditPanelOpen(false)}>
        <LinkPageBreakEditPanel
          value={value}
          onClose={() => setEditPanelOpen(false)}
          onChange={onChange}
        />
      </Drawer>
    </>
  )
}
