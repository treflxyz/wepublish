import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {
  Button,
  CheckPicker,
  Drawer,
  Form,
  Message,
  Panel,
  Schema,
  TagPicker,
  toaster,
  Toggle
} from 'rsuite'

import {
  AvailablePaymentMethod,
  FullMemberPlanFragment,
  FullPaymentMethodFragment,
  ImageRefFragment,
  Maybe,
  MemberPlanListDocument,
  PaymentMethod,
  useCreateMemberPlanMutation,
  useMemberPlanQuery,
  usePaymentMethodListQuery,
  useUpdateMemberPlanMutation
} from '../api'
import {ChooseEditImage} from '../atoms/chooseEditImage'
import {CurrencyInput} from '../atoms/currencyInput'
import {ListInput, ListValue} from '../atoms/listInput'
import {
  authorise,
  createCheckedPermissionComponent,
  PermissionControl
} from '../atoms/permissionControl'
import {createDefaultValue, RichTextBlock} from '../blocks/richTextBlock/richTextBlock'
import {RichTextBlockValue} from '../blocks/types'
import {toggleRequiredLabel} from '../toggleRequiredLabel'
import {
  ALL_PAYMENT_PERIODICITIES,
  generateID,
  getOperationNameFromDocument,
  slugify
} from '../utility'
import {ImageEditPanel} from './imageEditPanel'
import {ImageSelectPanel} from './imageSelectPanel'

export interface MemberPlanEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(author: FullMemberPlanFragment): void
}

function MemberPlanEditPanel({id, onClose, onSave}: MemberPlanEditPanelProps) {
  const {t} = useTranslation()
  const isAuthorized = authorise('CAN_CREATE_MEMBER_PLAN')

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [image, setImage] = useState<Maybe<ImageRefFragment>>()
  const [description, setDescription] = useState<RichTextBlockValue>(createDefaultValue())
  const [active, setActive] = useState<boolean>(true)
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<
    ListValue<AvailablePaymentMethod>[]
  >([])
  const [paymentMethods, setPaymentMethods] = useState<FullPaymentMethodFragment[]>([])

  const [amountPerMonthMin, setAmountPerMonthMin] = useState<number>(500)

  const [isChooseModalOpen, setChooseModalOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)

  const {data, loading: isLoading, error: loadError} = useMemberPlanQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id === undefined
  })

  const {
    data: paymentMethodData,
    loading: isLoadingPaymentMethods,
    error: paymentMethodLoadError
  } = usePaymentMethodListQuery({
    fetchPolicy: 'network-only'
  })

  const [createMemberPlan, {loading: isCreating, error: createError}] = useCreateMemberPlanMutation(
    {
      refetchQueries: [getOperationNameFromDocument(MemberPlanListDocument)]
    }
  )

  const [
    updateMemberPlan,
    {loading: isUpdating, error: updateError}
  ] = useUpdateMemberPlanMutation()

  const isDisabled =
    isLoading ||
    isLoadingPaymentMethods ||
    isCreating ||
    isUpdating ||
    loadError !== undefined ||
    paymentMethodLoadError !== undefined ||
    !isAuthorized

  useEffect(() => {
    if (data?.memberPlan) {
      setName(data.memberPlan.name)
      setSlug(data.memberPlan.slug)
      setTags(data.memberPlan.tags ?? [])
      setImage(data.memberPlan.image)
      setDescription(
        data.memberPlan.description ? data.memberPlan.description : createDefaultValue()
      )
      setActive(data.memberPlan.active)
      setAvailablePaymentMethods(
        data.memberPlan.availablePaymentMethods
          ? data.memberPlan.availablePaymentMethods.map(availablePaymentMethod => ({
              id: generateID(),
              value: availablePaymentMethod
            }))
          : []
      )
      setAmountPerMonthMin(data.memberPlan.amountPerMonthMin)
    }
  }, [data?.memberPlan])

  useEffect(() => {
    if (paymentMethodData?.paymentMethods) {
      setPaymentMethods(paymentMethodData.paymentMethods)
    }
  }, [paymentMethodData?.paymentMethods])

  useEffect(() => {
    const error =
      loadError?.message ??
      createError?.message ??
      updateError?.message ??
      paymentMethodLoadError?.message
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
  }, [loadError, createError, updateError, paymentMethodLoadError])

  function handleImageChange(image: ImageRefFragment) {
    setImage(image)
  }

  async function handleSave() {
    if (id) {
      const {data} = await updateMemberPlan({
        variables: {
          id,
          input: {
            name,
            slug,
            tags,
            imageID: image?.id,
            description,
            active,
            availablePaymentMethods: availablePaymentMethods.map(({value}) => ({
              paymentPeriodicities: value.paymentPeriodicities,
              forceAutoRenewal: value.forceAutoRenewal,
              paymentMethodIDs: value.paymentMethods.map(pm => pm.id)
            })),
            amountPerMonthMin
          }
        }
      })

      if (data?.updateMemberPlan) onSave?.(data.updateMemberPlan)
    } else {
      const {data} = await createMemberPlan({
        variables: {
          input: {
            name,
            slug,
            tags,
            imageID: image?.id,
            description,
            active,
            availablePaymentMethods: availablePaymentMethods.map(({value}) => ({
              paymentPeriodicities: value.paymentPeriodicities,
              forceAutoRenewal: value.forceAutoRenewal,
              paymentMethodIDs: value.paymentMethods.map(pm => pm.id)
            })),
            amountPerMonthMin
          }
        }
      })

      if (data?.createMemberPlan) onSave?.(data.createMemberPlan)
    }
  }

  // Schema used for form validation
  const {StringType, NumberType} = Schema.Types
  const validationModel = Schema.Model({
    name: StringType().isRequired(t('errorMessages.noNameErrorMessage')),
    currency: NumberType().isRequired(t('errorMessages.noAmountErrorMessage'))
  })

  return (
    <>
      <Form
        onSubmit={validationPassed => validationPassed && handleSave()}
        fluid
        model={validationModel}
        formValue={{name: name, currency: amountPerMonthMin}}
        style={{height: '100%'}}>
        <Drawer.Header>
          <Drawer.Title>
            {id ? t('memberPlanList.editTitle') : t('memberPlanList.createTitle')}
          </Drawer.Title>

          <Drawer.Actions>
            <PermissionControl qualifyingPermissions={['CAN_CREATE_MEMBER_PLAN']}>
              <Button appearance="primary" disabled={isDisabled} type="submit">
                {id ? t('save') : t('create')}
              </Button>
            </PermissionControl>
            <Button appearance={'subtle'} onClick={() => onClose?.()}>
              {t('close')}
            </Button>
          </Drawer.Actions>
        </Drawer.Header>
        <Drawer.Body>
          <Panel>
            <Form.Group controlId="memberPlanName">
              <Form.ControlLabel>{toggleRequiredLabel(t('memberPlanList.name'))}</Form.ControlLabel>
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
            <Form.Group controlId="memberPlanSlug">
              <Form.ControlLabel>{t('memberPlanList.slug')}</Form.ControlLabel>
              <Form.Control name={t('memberPlanList.slug')} value={slug} plaintext />
            </Form.Group>

            <Form.Group controlId="memberPlanTags">
              <Form.ControlLabel>{t('articleEditor.panels.tags')}</Form.ControlLabel>
              <TagPicker
                disabled={isDisabled}
                block
                virtualized
                value={tags ?? []}
                creatable
                data={tags ? tags.map(tag => ({label: tag, value: tag})) : []}
                onChange={tagsValue => setTags(tagsValue ?? [])}
              />
            </Form.Group>

            <Form.Group controlId="memberPlanActive">
              <Form.ControlLabel>{t('memberPlanList.active')}</Form.ControlLabel>
              <Toggle checked={active} disabled={isDisabled} onChange={value => setActive(value)} />
              <Form.HelpText>{t('memberPlanList.activeDescription')}</Form.HelpText>
            </Form.Group>

            <Form.Group controlId="memberPlanMinimumMonthlyAmount">
              <Form.ControlLabel>
                {toggleRequiredLabel(t('memberPlanList.minimumMonthlyAmount'))}
              </Form.ControlLabel>
              <CurrencyInput
                name="currency"
                currency="CHF"
                centAmount={amountPerMonthMin}
                disabled={isDisabled}
                onChange={centAmount => {
                  setAmountPerMonthMin(centAmount)
                }}
              />
            </Form.Group>
            <Form.Group controlId="memberPlanDescription">
              <Form.ControlLabel>{t('memberPlanList.description')}</Form.ControlLabel>
              <div className="richTextFrame">
                <RichTextBlock
                  value={description}
                  disabled={isDisabled}
                  onChange={value => setDescription(value)}
                />
              </div>
            </Form.Group>
          </Panel>

          <ChooseEditImage
            image={image}
            disabled={isLoading}
            openChooseModalOpen={() => setChooseModalOpen(true)}
            openEditModalOpen={() => setEditModalOpen(true)}
            removeImage={() => setImage(undefined)}
          />

          <Panel>
            <ListInput
              value={availablePaymentMethods}
              disabled={isDisabled}
              onChange={app => setAvailablePaymentMethods(app)}
              defaultValue={{
                forceAutoRenewal: false,
                paymentPeriodicities: [],
                paymentMethods: []
              }}>
              {({value, onChange}) => (
                <Form fluid>
                  <Form.Group controlId="memberPlanAutoRenewal">
                    <Form.ControlLabel>{t('memberPlanList.autoRenewal')}</Form.ControlLabel>
                    <Toggle
                      checked={value.forceAutoRenewal}
                      disabled={isDisabled}
                      onChange={forceAutoRenewal => onChange({...value, forceAutoRenewal})}
                    />
                    <Form.HelpText>{t('memberPlanList.autoRenewalDescription')}</Form.HelpText>
                  </Form.Group>
                  <Form.Group controlId="memberPlanPaymentPeriodicity">
                    <Form.ControlLabel>
                      {t('memberPlanList.paymentPeriodicities')}
                    </Form.ControlLabel>
                    <CheckPicker
                      virtualized
                      value={value.paymentPeriodicities}
                      data={ALL_PAYMENT_PERIODICITIES.map(pp => ({
                        value: pp,
                        label: t(`memberPlanList.paymentPeriodicity.${pp}`)
                      }))}
                      onChange={paymentPeriodicities => onChange({...value, paymentPeriodicities})}
                      block
                      placement="auto"
                    />
                  </Form.Group>
                  <Form.Group controlId="memberPlanPaymentMethod">
                    <Form.ControlLabel>{t('memberPlanList.paymentMethods')}</Form.ControlLabel>
                    <CheckPicker
                      virtualized
                      value={value.paymentMethods.map(pm => pm.id)}
                      data={paymentMethods.map(pm => ({value: pm.id, label: pm.name}))}
                      onChange={paymentMethodIDs => {
                        onChange({
                          ...value,
                          paymentMethods: paymentMethodIDs
                            .map(pmID => paymentMethods.find(pm => pm.id === pmID))
                            .filter(pm => pm !== undefined)
                            .map(pm => pm as PaymentMethod)
                        })
                      }}
                      block
                      placement="auto"
                    />
                  </Form.Group>
                </Form>
              )}
            </ListInput>
          </Panel>
        </Drawer.Body>

        <Drawer open={isChooseModalOpen} size="sm" onClose={() => setChooseModalOpen(false)}>
          <ImageSelectPanel
            onClose={() => setChooseModalOpen(false)}
            onSelect={(value: ImageRefFragment) => {
              setChooseModalOpen(false)
              handleImageChange(value)
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
      </Form>
    </>
  )
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MEMBER_PLANS',
  'CAN_GET_MEMBER_PLAN',
  'CAN_CREATE_MEMBER_PLAN',
  'CAN_DELETE_MEMBER_PLAN'
])(MemberPlanEditPanel)
export {CheckedPermissionComponent as MemberPlanEditPanel}
