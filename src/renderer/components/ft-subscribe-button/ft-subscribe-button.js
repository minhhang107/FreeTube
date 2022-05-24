import Vue from 'vue'
import { mapActions } from 'vuex'

import FtButton from '../../components/ft-button/ft-button.vue'

import { MAIN_PROFILE_ID } from '../../../constants'

export default Vue.extend({
  name: 'FtSubscribeButton',
  components: {
    'ft-button': FtButton
  },
  props: {
    channelId: {
      type: String,
      required: true
    },
    channelName: {
      type: String,
      required: true
    },
    channelThumbnail: {
      type: String,
      required: true
    },
    isSubscribed: {
      type: Boolean,
      required: true
    },
    subscribedText: {
      type: String,
      required: true
    }
  },
  data: function () {
    return {
      showProfiles: false
    }
  },
  computed: {
    profileList: function () {
      return this.$store.getters.getProfileList
    },

    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },

    profileInitials: function () {
      return this.profileList.map((profile) => {
        return profile?.name?.length > 0 ? Array.from(profile.name)[0].toUpperCase() : ''
      })
    },

    subscribedProfiles: function() {
      return this.profileList.filter((profile) => {
        const targetProfile = JSON.parse(JSON.stringify(profile))
        const channelIndex = targetProfile.subscriptions.findIndex((channel) => {
          return channel.id === this.channelId
        })
        return channelIndex !== -1
      })
    },

    notSubscribedProfiles: function() {
      return this.profileList.filter((profile) => {
        const targetProfile = JSON.parse(JSON.stringify(profile))
        const channelIndex = targetProfile.subscriptions.findIndex((channel) => {
          return channel.id === this.channelId
        })
        return channelIndex === -1
      })
    }
  },
  methods: {
    subscribe: function (profile, subscribe = true) {
      const profileIndex = this.profileList.findIndex((profileInList) => {
        return profileInList.name === profile.name
      })
      const targetProfile = JSON.parse(JSON.stringify(this.profileList[profileIndex]))
      const channelIndex = targetProfile.subscriptions.findIndex((channel) => {
        return channel.id === this.channelId
      })

      if (channelIndex !== -1 && subscribe) {
        this.showToast({
          message: this.$t('Channel.Channel already added to your subscriptions')
        })
      } else if (channelIndex !== -1 && !subscribe) {
        targetProfile.subscriptions = targetProfile.subscriptions.filter((channel) => {
          return channel.id !== this.channelId
        })
        this.updateProfile(targetProfile)
        if (targetProfile._id === MAIN_PROFILE_ID) {
          let duplicateSubscriptions = 0

          this.profileList.forEach((profile) => {
            if (profile._id === MAIN_PROFILE_ID) {
              return
            }
            this.profileList.forEach((profile) => {
              if (profile._id === MAIN_PROFILE_ID) {
                return
              }
              duplicateSubscriptions += this.unsubscribe(profile, this.channelId)
            })
          })
          if (duplicateSubscriptions > 0) {
            const message = this.$t('Channel.Removed subscription from $ other channel(s)')
            this.showToast({
              message: message.replace('$', duplicateSubscriptions)
            })
          }
        }
      } else {
        const primaryProfile = JSON.parse(JSON.stringify(this.profileList[0]))
        const subscription = {
          id: this.channelId,
          name: this.channelName,
          thumbnail: this.channelThumbnail
        }

        targetProfile.subscriptions.push(subscription)
        this.updateProfile(targetProfile)
        this.showToast({
          message: this.$t('Channel.Added channel to your subscriptions')
        })
        this.showProfiles = false

        const primaryProfileIndex = primaryProfile.subscriptions.findIndex((channel) => {
          return channel.id === this.channelId
        })

        if (primaryProfileIndex === -1) {
          primaryProfile.subscriptions.push(subscription)
          this.updateProfile(primaryProfile)
        }
      }
    },

    handleSubscription: function () {
      if (this.channelId === '') {
        return
      }

      const currentProfile = JSON.parse(JSON.stringify(this.activeProfile))
      const primaryProfile = JSON.parse(JSON.stringify(this.profileList[0]))

      if (this.isSubscribed) {
        currentProfile.subscriptions = currentProfile.subscriptions.filter((channel) => {
          return channel.id !== this.channelId
        })

        this.updateProfile(currentProfile)
        this.showToast({
          message: this.$t('Channel.Channel has been removed from your subscriptions')
        })

        if (this.activeProfile._id === MAIN_PROFILE_ID) {
          // Check if a subscription exists in a different profile.
          // Remove from there as well.
          let duplicateSubscriptions = 0

          this.profileList.forEach((profile) => {
            if (profile._id === MAIN_PROFILE_ID) {
              return
            }
            duplicateSubscriptions += this.unsubscribe(profile, this.channelId)
          })

          if (duplicateSubscriptions > 0) {
            const message = this.$t('Channel.Removed subscription from $ other channel(s)')
            this.showToast({
              message: message.replace('$', duplicateSubscriptions)
            })
          }
        }
      } else {
        const subscription = {
          id: this.channelId,
          name: this.channelName,
          thumbnail: this.channelThumbnail
        }
        currentProfile.subscriptions.push(subscription)

        this.updateProfile(currentProfile)
        this.showToast({
          message: this.$t('Channel.Added channel to your subscriptions')
        })

        if (this.activeProfile._id !== MAIN_PROFILE_ID) {
          const index = primaryProfile.subscriptions.findIndex((channel) => {
            return channel.id === this.channelId
          })

          if (index === -1) {
            primaryProfile.subscriptions.push(subscription)
            this.updateProfile(primaryProfile)
          }
        }
      }
    },

    showProfileList: function (profileType) {
      if (this.showProfiles === profileType) {
        this.showProfiles = false
      } else {
        this.showProfiles = profileType
      }
    },

    unsubscribe: function(profile, channelId) {
      const parsedProfile = JSON.parse(JSON.stringify(profile))
      const index = parsedProfile.subscriptions.findIndex((channel) => {
        return channel.id === channelId
      })

      if (index !== -1) {
        parsedProfile.subscriptions = parsedProfile.subscriptions.filter((x) => {
          return x.id !== channelId
        })

        this.updateProfile(parsedProfile)
        return 1
      }
      return 0
    },

    ...mapActions([
      'showToast',
      'updateProfile'
    ])
  }
})
