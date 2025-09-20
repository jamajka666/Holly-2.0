package app.netlify.holly2_pro.twa.vault

object LockState {
    @Volatile var lastUnlockAt: Long = 0L
    var timeoutMs: Long = 60_000 // 60 s
    fun unlockNow() { lastUnlockAt = System.currentTimeMillis() }
    fun isLocked(): Boolean = (System.currentTimeMillis() - lastUnlockAt) > timeoutMs
}
