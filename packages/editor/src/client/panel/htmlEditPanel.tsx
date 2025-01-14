import React, {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Drawer, Input} from 'rsuite'

import {HTMLBlockValue} from '../blocks/types'

export interface HtmlEditPanelProps {
  readonly value: HTMLBlockValue
  onClose(): void
  onConfirm(value: HTMLBlockValue): void
}

export function HtmlEditPanel({value, onClose, onConfirm}: HtmlEditPanelProps) {
  const [htmlBlock, setHtmlBlock] = useState<HTMLBlockValue>(value)
  const isEmpty = htmlBlock === undefined
  const {t} = useTranslation()

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>{t('blocks.html.edit')}</Drawer.Title>

        <Drawer.Actions>
          <Button appearance="primary" disabled={isEmpty} onClick={() => onConfirm(htmlBlock)}>
            {t('blocks.html.confirm')}
          </Button>
          <Button appearance={'subtle'} onClick={() => onClose?.()}>
            {t('blocks.html.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        <Input
          as="textarea"
          rows={3}
          style={{width: '100%'}}
          placeholder={t('blocks.html.placeholder')}
          value={htmlBlock.html}
          onChange={input => setHtmlBlock({html: input})}
        />
        <div style={{marginTop: '20px'}}>
          <span>{t('blocks.html.warning')}</span>
        </div>
      </Drawer.Body>
    </>
  )
}
