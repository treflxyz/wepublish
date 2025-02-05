import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdLink} from 'react-icons/md'
import {
  Button,
  Drawer,
  Form,
  Input,
  InputGroup,
  Message,
  Panel,
  PanelGroup,
  Schema,
  toaster
} from 'rsuite'

import {
  AuthorLink,
  AuthorListDocument,
  FullAuthorFragment,
  ImageRefFragment,
  Maybe,
  useAuthorQuery,
  useCreateAuthorMutation,
  useUpdateAuthorMutation
} from '../api'
import {ChooseEditImage} from '../atoms/chooseEditImage'
import {ListInput, ListValue} from '../atoms/listInput'
import {
  authorise,
  createCheckedPermissionComponent,
  PermissionControl
} from '../atoms/permissionControl'
import {createDefaultValue, RichTextBlock} from '../blocks/richTextBlock/richTextBlock'
import {RichTextBlockValue} from '../blocks/types'
import {toggleRequiredLabel} from '../toggleRequiredLabel'
import {generateID, getOperationNameFromDocument, slugify} from '../utility'
import {ImageEditPanel} from './imageEditPanel'
import {ImageSelectPanel} from './imageSelectPanel'

export interface AuthorEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(author: FullAuthorFragment): void
}

function AuthorEditPanel({id, onClose, onSave}: AuthorEditPanelProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [image, setImage] = useState<Maybe<ImageRefFragment>>()
  const [bio, setBio] = useState<RichTextBlockValue>(createDefaultValue())
  const [links, setLinks] = useState<ListValue<AuthorLink>[]>([
    {id: generateID(), value: {title: '', url: ''}}
  ])

  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const isAuthorized = authorise('CAN_CREATE_AUTHOR')

  const {data, loading: isLoading, error: loadError} = useAuthorQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id === undefined
  })

  const [createAuthor, {loading: isCreating, error: createError}] = useCreateAuthorMutation({
    refetchQueries: [getOperationNameFromDocument(AuthorListDocument)]
  })

  const [updateAuthor, {loading: isUpdating, error: updateError}] = useUpdateAuthorMutation()

  const isDisabled =
    isLoading || isCreating || isUpdating || loadError !== undefined || !isAuthorized

  const {t} = useTranslation()

  useEffect(() => {
    if (data?.author) {
      setName(data.author.name)
      setSlug(data.author.slug)
      setJobTitle(data.author.jobTitle ?? '')
      setImage(data.author.image)
      setBio(data.author.bio ? data.author.bio : createDefaultValue())
      setLinks(
        data.author.links
          ? data.author.links.map(link => ({
              id: generateID(),
              value: {
                title: link.title,
                url: link.url
              }
            }))
          : []
      )
    }
  }, [data?.author])

  useEffect(() => {
    const error = loadError?.message ?? createError?.message ?? updateError?.message
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
  }, [loadError, createError, updateError])

  function handleImageChange(image: ImageRefFragment) {
    setImage(image)
  }

  async function handleSave() {
    if (id) {
      const {data} = await updateAuthor({
        variables: {
          id,
          input: {
            name,
            slug,
            jobTitle,
            imageID: image?.id,
            links: links.map(({value}) => value),
            bio
          }
        }
      })

      if (data?.updateAuthor) onSave?.(data.updateAuthor)
    } else {
      const {data} = await createAuthor({
        variables: {
          input: {
            name,
            slug,
            jobTitle,
            imageID: image?.id,
            links: links.map(({value}) => value),
            bio
          }
        }
      })

      if (data?.createAuthor) onSave?.(data.createAuthor)
    }
  }

  // Defines field requirements
  const {StringType} = Schema.Types
  const validationModel = Schema.Model({
    name: StringType().isRequired(t('errorMessages.noNameErrorMessage')),
    link: StringType().isURL(t('errorMessages.invalidUrlErrorMessage'))
  })

  return (
    <>
      <Form
        onSubmit={validationPassed => validationPassed && handleSave()}
        fluid
        model={validationModel}
        formValue={{name}}
        style={{height: '100%'}}>
        <Drawer.Header>
          <Drawer.Title>
            {id ? t('authors.panels.editAuthor') : t('authors.panels.createAuthor')}
          </Drawer.Title>

          <Drawer.Actions>
            <PermissionControl qualifyingPermissions={['CAN_CREATE_AUTHOR']}>
              <Button
                appearance="primary"
                disabled={isDisabled}
                type="submit"
                data-testid="saveButton">
                {id ? t('save') : t('create')}
              </Button>
            </PermissionControl>
            <Button appearance={'subtle'} onClick={() => onClose?.()}>
              {t('authors.panels.close')}
            </Button>
          </Drawer.Actions>
        </Drawer.Header>

        <Drawer.Body>
          <PanelGroup>
            <Panel>
              <Form.Group controlId="name">
                <Form.ControlLabel>
                  {toggleRequiredLabel(t('authors.panels.name'))}
                </Form.ControlLabel>

                <Form.Control
                  name="name"
                  value={name}
                  disabled={isDisabled}
                  onChange={(value: string) => {
                    setName(value)
                    setSlug(slugify(value))
                  }}
                />
              </Form.Group>
              <Form.Group controlId="jobTitle">
                <Form.ControlLabel>{t('authors.panels.jobTitle')}</Form.ControlLabel>
                <Form.Control
                  name={t('authors.panels.jobTitle')}
                  value={jobTitle}
                  disabled={isDisabled}
                  onChange={(value: string) => {
                    setJobTitle(value)
                  }}
                />
              </Form.Group>
            </Panel>
            <Panel header={t('authors.panels.image')}>
              <ChooseEditImage
                image={image}
                header={''}
                top={0}
                left={0}
                disabled={isLoading}
                openChooseModalOpen={() => setChooseModalOpen(true)}
                openEditModalOpen={() => setEditModalOpen(true)}
                removeImage={() => setImage(undefined)}
              />
            </Panel>
            <Panel header={t('authors.panels.links')} className="authorLinks">
              <ListInput
                disabled={isDisabled}
                value={links}
                onChange={links => {
                  setLinks(links)
                }}
                defaultValue={{title: '', url: ''}}>
                {({value, onChange}) => (
                  <div style={{display: 'flex', flexDirection: 'row'}}>
                    <Form.Control
                      name="title"
                      placeholder={t('authors.panels.title')}
                      value={value.title}
                      onChange={(title: string) => onChange({...value, title})}
                    />
                    <Form.Group>
                      <InputGroup inside style={{width: '230px', marginLeft: '5px'}}>
                        <InputGroup.Addon>
                          <MdLink />
                        </InputGroup.Addon>

                        <Form.Control
                          name="link"
                          placeholder={t('authors.panels.link') + ':https//link.com'}
                          value={value.url}
                          onChange={(url: any) => onChange({...value, url})}
                          accepter={Input}
                        />
                      </InputGroup>
                    </Form.Group>
                  </div>
                )}
              </ListInput>
            </Panel>
            <Panel header={t('authors.panels.bioInformation')}>
              <div className="richTextFrame">
                <RichTextBlock
                  disabled={isDisabled}
                  value={bio}
                  onChange={value => setBio(value)}
                />
              </div>
            </Panel>
          </PanelGroup>
        </Drawer.Body>
      </Form>

      <Drawer open={isChooseModalOpen} size="sm" onClose={() => setChooseModalOpen(false)}>
        <ImageSelectPanel
          onClose={() => setChooseModalOpen(false)}
          onSelect={(value: ImageRefFragment) => {
            setChooseModalOpen(false)
            handleImageChange(value)
          }}
        />
      </Drawer>

      <Drawer open={isEditModalOpen} size="sm">
        <ImageEditPanel
          id={image?.id}
          onClose={() => setEditModalOpen(false)}
          onSave={() => setEditModalOpen(false)}
        />
      </Drawer>
    </>
  )
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_AUTHOR',
  'CAN_GET_AUTHORS',
  'CAN_CREATE_AUTHOR',
  'CAN_DELETE_AUTHOR'
])(AuthorEditPanel)
export {CheckedPermissionComponent as AuthorEditPanel}
